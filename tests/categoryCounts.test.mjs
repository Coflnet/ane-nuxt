import assert from 'node:assert/strict'
import test from 'node:test'
import { formatCategoryCount, getCategoryProductCount, normalizeCategoryCounts, resolveCategoryCount } from '../utils/categoryCounts.ts'

// Regression: `GET /api/Categories/with-counts` is keyed by lowercase GERMAN category label
// (that's the language the product index stores categories in) no matter which language the
// UI is showing. Looking counts up by the currently-displayed label meant the English UI
// showed "Collectible Trading Cards" with no count, while the German UI correctly showed
// "Sammelkarten 2.4k products" for the very same category.
test('an English label resolves to the count stored under its German counterpart', () => {
  const counts = normalizeCategoryCounts({ Sammelkarten: 2205 })
  const germanLabelBySlug = { 6997: 'Sammelkarten' }

  const english = resolveCategoryCount({ slug: '6997', label: 'Collectible Trading Cards' }, counts, germanLabelBySlug)
  const german = resolveCategoryCount({ slug: '6997', label: 'Sammelkarten' }, counts, germanLabelBySlug)

  assert.equal(english, 2205)
  assert.equal(german, 2205)
})

test('a category missing from the counts map resolves to 0', () => {
  const counts = normalizeCategoryCounts({ Elektronik: 18600 })

  assert.equal(resolveCategoryCount({ slug: '999', label: 'Unknown Category' }, counts, {}), 0)
  // no German label known for the slug either — still falls back cleanly, not a throw
  assert.equal(resolveCategoryCount({ slug: '999', label: 'Unknown Category' }, counts), 0)
})

test('getCategoryProductCount rolls up counts across all subcategory depths', () => {
  const counts = normalizeCategoryCounts({
    'bekleidung & accessoires': 100,
    'herrenbekleidung': 40,
    't-shirts': 15,
  })
  const germanLabelBySlug = {
    1604: 'Bekleidung & Accessoires',
    1605: 'Herrenbekleidung',
    1606: 'T-Shirts',
  }
  const node = {
    slug: '1604',
    label: 'Clothing & Accessories',
    subCategories: [
      {
        slug: '1605',
        label: 'Men\'s Clothing',
        subCategories: [
          { slug: '1606', label: 'T-Shirts' },
        ],
      },
    ],
  }

  assert.equal(getCategoryProductCount(node, counts, germanLabelBySlug), 100 + 40 + 15)
})

test('formatCategoryCount abbreviates thousands', () => {
  assert.equal(formatCategoryCount(2400), '2.4k')
  assert.equal(formatCategoryCount(1000), '1k')
  assert.equal(formatCategoryCount(411), '411')
  assert.equal(formatCategoryCount(0), '0')
})
