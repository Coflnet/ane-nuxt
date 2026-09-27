import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// pages/search.vue is a Vue SFC relying on Nuxt's ambient auto-imports and route/composable
// state, so it can't be imported directly in plain Node; assert on its source text instead,
// matching the pattern already used by listing-availability-check.test.mjs.

// Regression: `useRaceableAsyncData(...)` was declared before `const { ..., toApiSlug, ... } =
// useCategories()`. Nuxt's `useAsyncData` runs its fetcher immediately during setup, and that
// fetcher calls `buildSearchParams()`, which references `toApiSlug`/`urlToNumeric`/
// `germanLabelBySlug` whenever a `category` is present in the URL. Because those are `const`
// bindings from a call declared *later* in the script, that first eager fetch hit the
// temporal dead zone and threw `ReferenceError: Cannot access 'toApiSlug' before
// initialization` — synchronously, before any request was even sent — for every
// `/search?category=...` URL. The throw escaped before the `.then()`/`.catch()` handlers that
// set `hasSearched`/`searchError` during SSR, so the page silently fell back to the category
// browser on the server and surfaced as "Search failed" once the client-side path hit the
// same error. `useCategories()` must stay declared before `useRaceableAsyncData` so those
// bindings exist by the time the eager fetch runs.
test('useCategories() is destructured before useRaceableAsyncData is declared', async () => {
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')

  const categoriesIdx = source.indexOf('= useCategories()')
  const raceableIdx = source.indexOf('useRaceableAsyncData(')

  assert.ok(categoriesIdx !== -1, 'useCategories() call not found in pages/search.vue')
  assert.ok(raceableIdx !== -1, 'useRaceableAsyncData( call not found in pages/search.vue')
  assert.ok(
    categoriesIdx < raceableIdx,
    'useCategories() must be destructured before useRaceableAsyncData(...) is declared, otherwise its eager fetcher references toApiSlug/urlToNumeric/germanLabelBySlug before they are initialized',
  )
})

// Regression companion: the eager fetcher builds the category search param from
// `toApiSlug`/`urlToNumeric` and `germanLabelBySlug`, both only populated once
// `fetchTopLevelCategories()`/`ensureGermanLabels()` resolve. The fetcher must await both
// before calling `buildSearchParams()` whenever a category is selected, so the very first
// search (SSR or the initial client fetch) already sends the resolved value instead of the
// unmapped URL slug.
test('the initial search fetcher resolves category labels before building search params', async () => {
  const source = await readFile(new URL('../pages/search.vue', import.meta.url), 'utf8')

  const fetcherMatch = source.match(/const \{ data: initialSearch[\s\S]*?useRaceableAsyncData\(([\s\S]*?)\n\)/)
  assert.ok(fetcherMatch, 'useRaceableAsyncData(...) call body not found')
  const body = fetcherMatch[1]

  const labelsReadyIdx = body.indexOf('fetchTopLevelCategories()')
  const germanLabelsIdx = body.indexOf('ensureGermanLabels()')
  const buildParamsIdx = body.indexOf('buildSearchParams(0)')

  assert.ok(labelsReadyIdx !== -1, 'fetcher must call fetchTopLevelCategories() to populate urlToNumeric')
  assert.ok(germanLabelsIdx !== -1, 'fetcher must call ensureGermanLabels() to populate germanLabelBySlug')
  assert.ok(buildParamsIdx !== -1, 'fetcher must call buildSearchParams(0)')
  assert.ok(labelsReadyIdx < buildParamsIdx, 'fetchTopLevelCategories() must run before buildSearchParams(0)')
  assert.ok(germanLabelsIdx < buildParamsIdx, 'ensureGermanLabels() must run before buildSearchParams(0)')
})
