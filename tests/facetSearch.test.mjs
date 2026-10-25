import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'
import { facetSearchParams } from '../utils/facetSearch.ts'

test('facet discovery preserves every search constraint except its own selected exact value', () => {
  const scope = { query: 'comics', category: 'comics', condition: 'used', country: 'DE', minPrice: 5, maxPrice: 50, lat: 52, lon: 13, maxDistanceKm: 20, attributes: ['series:Tintin', 'language:French'], offset: 40, limit: 20 }
  assert.deepEqual(facetSearchParams(scope, 'series', 'Astérix'), {
    ...scope, attributes: ['language:French'], offset: 0, limit: 0, facetKey: 'series', facetQuery: 'Astérix',
  })
  assert.deepEqual(scope.attributes, ['series:Tintin', 'language:French'])
})

async function createField(loadValues, buckets = []) {
  const file = new URL('../components/filters/AttributeFilter.vue', import.meta.url)
  const { descriptor } = parse(await readFile(file, 'utf8'))
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'facet-test' }).content)
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g, (_, names) => `const {${names.replace(/\bas\b/g, ':')}} = __vue`)
    .replace('export default', 'return')
  const component = new Function('__vue', 'ref', 'computed', 'watch', 'onBeforeUnmount', code)(
    await import('vue'), ref, computed, watch, () => {},
  )
  const props = reactive({ title: 'Series', buckets, selected: 'Selected outside the top 50', scope: 'one', formatValue: value => value, loadValues })
  const effects = effectScope()
  const state = effects.run(() => component.setup(props, { expose() {}, emit() {} }))
  return { state, props, stop: () => effects.stop() }
}

test('all returned options are reachable, with an out-of-response selection kept visible', async () => {
  const buckets = Array.from({ length: 50 }, (_, i) => ({ value: `Series ${i}`, count: 2 }))
  const { state, stop } = await createField(async () => buckets, buckets)
  assert.equal(state.visibleBuckets.value.length, 51)
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Series 49')
  assert.equal(state.visibleBuckets.value[0].count, undefined, 'an unknown count is not fabricated')
  stop()
})

test('remote discovery debounces, ignores stale responses, and keeps input and selection through error and retry', async () => {
  const pending = []
  const { state, props, stop } = await createField(query => new Promise((resolve, reject) => pending.push({ query, resolve, reject })))
  state.query.value = 'rare'
  await nextTick()
  assert.equal(pending.length, 0)
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(pending[0].query, 'rare')
  state.query.value = 'rare comic'
  await nextTick()
  pending[0].resolve([{ value: 'Stale' }])
  await nextTick()
  assert.equal(state.found.value, null)
  await new Promise(resolve => setTimeout(resolve, 330))
  pending[1].reject(new Error('offline'))
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(state.error.value, true)
  assert.equal(state.query.value, 'rare comic')
  assert.equal(state.visibleBuckets.value[0].value, props.selected)
  const retry = state.load()
  pending[2].resolve([{ value: 'Rare comic 181', count: 1 }])
  await retry
  assert.equal(state.error.value, false)
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Rare comic 181')
  assert.equal(state.query.value, 'rare comic')
  stop()
})

test('a scope change refreshes untouched fields from props without per-facet requests', async () => {
  let requests = 0
  const fields = await Promise.all(Array.from({ length: 4 }, () => createField(async () => {
    requests++
    return []
  })))
  for (const { props } of fields) {
    props.scope = 'new search filters'
    props.buckets = [{ value: 'New scope option', count: 3 }]
    await nextTick()
  }
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(requests, 0, 'the main search already returns buckets for untouched fields')
  for (const { state, props } of fields) {
    assert.equal(state.loading.value, false)
    assert.equal(state.visibleBuckets.value.at(-1).value, 'New scope option')
    assert.equal(state.visibleBuckets.value[0].value, props.selected)
  }
  fields.forEach(field => field.stop())
})

test('clearing a value query restores scoped buckets and cancels stale discovery', async () => {
  const pending = []
  const { state, props, stop } = await createField(query => new Promise(resolve => pending.push({ query, resolve })), [{ value: 'Scoped option' }])
  state.query.value = '   '
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(pending.length, 0)
  state.query.value = 'rare'
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(pending.length, 1)
  state.query.value = ''
  await nextTick()
  pending[0].resolve([{ value: 'Obsolete result' }])
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(pending.length, 1, 'clearing the query must not request all facet values')
  assert.equal(state.loading.value, false)
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Scoped option')
  assert.equal(state.visibleBuckets.value[0].value, props.selected)
  stop()
})

test('a searched field clears old-scope results before a failed refresh and preserves input and selection', async () => {
  let fail = false
  const { state, props, stop } = await createField(async () => {
    if (fail) throw new Error('offline')
    return [{ value: 'Old country option' }]
  })
  state.query.value = 'rare'
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(state.visibleBuckets.value.at(-1).value, 'Old country option')
  fail = true
  props.scope = 'new country'
  props.buckets = [{ value: 'New country option' }]
  await nextTick()
  assert.equal(state.found.value, null)
  await new Promise(resolve => setTimeout(resolve, 330))
  assert.equal(state.error.value, true)
  assert.equal(state.query.value, 'rare')
  assert.deepEqual(state.visibleBuckets.value.map(b => b.value), [props.selected, 'New country option'])
  stop()
})
