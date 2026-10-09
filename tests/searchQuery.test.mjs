import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { searchRouteQuery } from '../utils/searchQuery.ts'

test('non-empty search keeps q', () => {
  assert.deepEqual(searchRouteQuery('iphone 15'), { q: 'iphone 15' })
  assert.deepEqual(searchRouteQuery('  ps5 '), { q: 'ps5' })
})

test('empty or blank search has no q so /search shows categories', () => {
  assert.deepEqual(searchRouteQuery(''), {})
  assert.deepEqual(searchRouteQuery('   '), {})
  assert.deepEqual(searchRouteQuery(undefined), {})
})

// Regression: submitting an empty box did nothing because ProductSearch only emitted for non-empty text.
test('ProductSearch emits search for an empty submit and both pages route it without q', async () => {
  const comp = await readFile(new URL('../components/product/ProductSearch.vue', import.meta.url), 'utf8')
  const fn = comp.match(/function handleSearch\(\) \{([\s\S]*?)\n\}/)[1]
  assert.ok(!/if \(q\) \{\s*emit\('search', q\)/.test(fn), 'emit must not be guarded by non-empty q')
  assert.match(fn, /emit\('search', query\.value\.trim\(\)\)/)
  const index = await readFile(new URL('../pages/index.vue', import.meta.url), 'utf8')
  assert.match(index, /query: searchRouteQuery\(query\)/)
  const search = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')
  assert.match(search, /router\.push\(\{ query: searchRouteQuery\(query\) \}\)/)
})

test('landing nav links to search first, header nav on mobile too', async () => {
  const layout = await readFile(new URL('../layouts/landing.vue', import.meta.url), 'utf8')
  const hits = [...layout.matchAll(/localePath\('\/search'\)/g)]
  assert.equal(hits.length, 2)
})

test('hero notification uses euro', async () => {
  for (const l of ['en', 'de']) {
    const j = JSON.parse(await readFile(new URL(`../locales/${l}.json`, import.meta.url), 'utf8'))
    assert.match(j.hero.notification.content, /€/)
    assert.ok(!j.hero.notification.content.includes('$'))
  }
})
