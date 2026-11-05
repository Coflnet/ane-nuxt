import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import { computed, reactive, ref } from 'vue'
import { resolveSearchCategoryParam } from '../utils/searchCategoryParam.ts'

async function page(category, buckets) {
  const { descriptor } = parse(await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8'))
  const source = descriptor.scriptSetup.content
  const ast = compileScript(descriptor, { id: 'selected-category-facet' }).scriptSetupAst
  const variables = new Set(['selectedCategory', 'availableCategoryBuckets'])
  const functions = new Set(['isCategorySelected', 'toggleFilter'])
  const code = ast.filter(node =>
    (node.type === 'VariableDeclaration' && node.declarations.some(d => variables.has(d.id.name)))
    || (node.type === 'FunctionDeclaration' && functions.has(node.id.name)),
  ).map(node => source.slice(node.start, node.end)).join('\n')
  const route = reactive({ query: { q: 'Jacke', category, country: 'DE', attr_size: 'M' } })
  const urlToNumeric = ref({ clothing: '1604' })
  const germanLabelBySlug = ref({ 1604: 'Bekleidung' })
  const router = { push: ({ query }) => {
    route.query = query
  } }
  const queryWithoutKeys = (...keys) => Object.fromEntries(Object.entries(route.query).filter(([key]) => !keys.includes(key)))
  const state = new Function('computed', 'route', 'categoryBuckets', 'toApiSlug', 'resolveSearchCategoryParam', 'urlToNumeric', 'germanLabelBySlug', 'router', 'queryWithoutKeys', 'selectedStore', `
    ${stripTypeScriptTypes(code)}
    return { availableCategoryBuckets, isCategorySelected, toggleFilter };
  `)(computed, route, ref(buckets), value => urlToNumeric.value[value] || value,
    resolveSearchCategoryParam, urlToNumeric, germanLabelBySlug, router, queryWithoutKeys, ref(''))
  return { ...state, route }
}

for (const category of ['clothing', '1604', 'Bekleidung']) {
  test(`selected ${category} keeps the API taxonomy category visible and highlighted`, async () => {
    const bucket = { value: 'Bekleidung', count: 12 }
    const state = await page(category, [bucket, { value: 'Elektronik', count: 3 }])
    assert.deepEqual(state.availableCategoryBuckets.value, [bucket])
    assert.equal(state.isCategorySelected('Bekleidung'), true)
    assert.equal(state.isCategorySelected('Elektronik'), false)
  })

  test(`clicking the selected category label clears ${category} and preserves other filters`, async () => {
    const state = await page(category, [{ value: 'Bekleidung', count: 12 }])
    state.toggleFilter('category', 'Bekleidung')
    assert.deepEqual(state.route.query, { q: 'Jacke', country: 'DE', attr_size: 'M' })
  })
}

test('numeric buckets and the unselected category list retain their existing behavior', async () => {
  const selected = await page('clothing', [{ value: '1604', count: 12 }])
  assert.deepEqual(selected.availableCategoryBuckets.value, [{ value: '1604', count: 12 }])
  const unselected = await page('', [{ value: 'Bekleidung', count: 12 }, { value: 'General', count: 10 }, { value: 'Elektronik', count: 0 }])
  assert.deepEqual(unselected.availableCategoryBuckets.value, [{ value: 'Bekleidung', count: 12 }])
})
