import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSearchCategoryParam } from '../utils/searchCategoryParam.ts'

// Regression: GET /api/product/search only matches `category=<German taxonomy label>`
// (e.g. "Bekleidung"), so sending a numeric slug ("1604") or an English label ("clothing")
// returned 0 results. Once the German label for a category's numeric slug is known
// (useCategories().germanLabelBySlug, fetched from /api/Categories/top-level?lang=de),
// it should be sent instead.
test('resolves a URL slug to its German label via the numeric slug', () => {
  const urlToNumeric = { clothing: '1604' }
  const germanLabelBySlug = { 1604: 'Bekleidung' }

  assert.equal(resolveSearchCategoryParam('clothing', urlToNumeric, germanLabelBySlug), 'Bekleidung')
})

test('resolves a numeric slug directly to its German label', () => {
  const germanLabelBySlug = { 1604: 'Bekleidung' }

  assert.equal(resolveSearchCategoryParam('1604', {}, germanLabelBySlug), 'Bekleidung')
})

test('falls back to the API slug when no German label is known yet (e.g. before it has loaded)', () => {
  const urlToNumeric = { clothing: '1604' }

  assert.equal(resolveSearchCategoryParam('clothing', urlToNumeric, {}), '1604')
})

test('falls back to the raw value when neither mapping has an entry', () => {
  assert.equal(resolveSearchCategoryParam('unknown-category', {}, {}), 'unknown-category')
})

test('a value that is already the German label passes through unchanged', () => {
  const germanLabelBySlug = { 1604: 'Bekleidung' }

  assert.equal(resolveSearchCategoryParam('Bekleidung', {}, germanLabelBySlug), 'Bekleidung')
})

test('an empty category value is returned as-is', () => {
  assert.equal(resolveSearchCategoryParam('', { clothing: '1604' }, { 1604: 'Bekleidung' }), '')
})
