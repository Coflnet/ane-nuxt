import assert from 'node:assert/strict'
import test from 'node:test'
import { countPopulatedSubCategories, formatCategoryCount, getCategoryProductCount, normalizeCategoryCounts, resolveCategoryCount } from '../utils/categoryCounts.ts'

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

// Regression: the "Clothing" tile showed "N subcategories" using the raw `subCategories.length`
// from the taxonomy tree, but Google-taxonomy children like "Suits" or "Baby & Toddler Clothing"
// have zero matching listings. Clicking through landed on a browse page with nothing but a
// "Show Products" button. The badge — and the click-through decision — must count only the
// direct subcategories that actually have products (rolled up across their own descendants).
test('countPopulatedSubCategories only counts direct children that have products', () => {
  const counts = normalizeCategoryCounts({
    'herrenbekleidung': 40,
    't-shirts': 15,
  })
  const germanLabelBySlug = {
    1605: 'Herrenbekleidung',
    1606: 'T-Shirts',
    1594: 'Anzüge', // "Suits" — no matching count anywhere in its subtree
  }
  const node = {
    slug: '1604',
    label: 'Clothing',
    subCategories: [
      { slug: '1605', label: 'Men\'s Clothing' }, // has its own count
      { slug: '1594', label: 'Suits', subCategories: [{ slug: '5183', label: 'Pant Suits' }] }, // empty subtree
      { slug: '1607', label: 'T-Shirts Parent', subCategories: [{ slug: '1606', label: 'T-Shirts' }] }, // empty itself, populated child
    ],
  }

  assert.equal(countPopulatedSubCategories(node, counts, germanLabelBySlug), 2)
})

test('countPopulatedSubCategories is 0 when there are no subcategories, or none have products', () => {
  const counts = normalizeCategoryCounts({})

  assert.equal(countPopulatedSubCategories({ slug: '1', label: 'Leaf' }, counts), 0)
  assert.equal(
    countPopulatedSubCategories(
      { slug: '1', label: 'Parent', subCategories: [{ slug: '2', label: 'Empty child' }] },
      counts,
    ),
    0,
  )
})

test('formatCategoryCount abbreviates thousands', () => {
  assert.equal(formatCategoryCount(2400), '2.4k')
  assert.equal(formatCategoryCount(1000), '1k')
  assert.equal(formatCategoryCount(411), '411')
  assert.equal(formatCategoryCount(0), '0')
})

// Regression: the category tiles (with-counts, a label terms aggregation) and the search results
// total (CategoryQueryResolver + the category filter query) used different resolution paths, so
// e.g. the Clothing tile showed "494 products" while ?category=clothing found 1487. The exact,
// numeric-slug-keyed GET /api/Categories/counts-by-slug is computed with the same query the search
// endpoint uses per slug and must be preferred over the label-based lookup whenever present.
test('resolveCategoryCount prefers countsBySlug over the label-based lookup', () => {
  const counts = normalizeCategoryCounts({ bekleidung: 494 }) // the old, mismatched tile source
  const countsBySlug = { 1604: 1487 } // exact count for the same category, from the new endpoint

  assert.equal(resolveCategoryCount({ slug: '1604', label: 'Clothing' }, counts, {}, countsBySlug), 1487)
})

test('resolveCategoryCount falls back to the label-based lookup when countsBySlug has no entry for the slug', () => {
  const counts = normalizeCategoryCounts({ elektronik: 18600 })
  const germanLabelBySlug = { 222: 'Elektronik' }
  const countsBySlug = { 1604: 1487 } // some other slug present, but not 222

  assert.equal(resolveCategoryCount({ slug: '222', label: 'Electronics' }, counts, germanLabelBySlug, countsBySlug), 18600)
})

test('resolveCategoryCount falls back to the label-based lookup when countsBySlug is null (endpoint unavailable)', () => {
  const counts = normalizeCategoryCounts({ elektronik: 18600 })
  const germanLabelBySlug = { 222: 'Elektronik' }

  assert.equal(resolveCategoryCount({ slug: '222', label: 'Electronics' }, counts, germanLabelBySlug, null), 18600)
})

// getCategoryProductCount must return countsBySlug's value AS-IS for a node it covers, not add its
// (already-included) children's counts on top - countsBySlug is authoritative for the whole subtree.
test('getCategoryProductCount does not add child counts on top of an authoritative countsBySlug entry', () => {
  const counts = normalizeCategoryCounts({ herrenbekleidung: 40 })
  const countsBySlug = { 1604: 1487 }
  const node = {
    slug: '1604',
    label: 'Clothing',
    subCategories: [{ slug: '1605', label: 'Men\'s Clothing' }],
  }

  assert.equal(getCategoryProductCount(node, counts, {}, countsBySlug), 1487)
})

test('getCategoryProductCount rolls up child slugs individually when the parent has no countsBySlug entry', () => {
  const counts = normalizeCategoryCounts({})
  const countsBySlug = { 1605: 40, 1606: 15 } // parent 1604 missing, but both children present
  const node = {
    slug: '1604',
    label: 'Clothing',
    subCategories: [
      { slug: '1605', label: 'Men\'s Clothing' },
      { slug: '1606', label: 'T-Shirts' },
    ],
  }

  assert.equal(getCategoryProductCount(node, counts, {}, countsBySlug), 40 + 15)
})

test('countPopulatedSubCategories uses countsBySlug per direct child when available', () => {
  const counts = normalizeCategoryCounts({})
  const countsBySlug = { 1605: 40, 1594: 0 }
  const node = {
    slug: '1604',
    label: 'Clothing',
    subCategories: [
      { slug: '1605', label: 'Men\'s Clothing' },
      { slug: '1594', label: 'Suits' },
    ],
  }

  assert.equal(countPopulatedSubCategories(node, counts, {}, countsBySlug), 1)
})
