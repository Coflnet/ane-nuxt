/**
 * Pure lookup helpers for resolving product counts for a category node.
 *
 * The counts API (`GET /api/Categories/with-counts`) is keyed by lowercase GERMAN
 * category label (that's the language the product search index stores categories
 * in), regardless of which language the UI is currently displaying. Looking counts
 * up by the currently-displayed label therefore only worked for the German UI —
 * the English UI showed "Collectible Trading Cards" with no count next to it.
 *
 * `germanLabelBySlug` breaks that coupling: it maps a category's numeric slug to
 * its German label, so a count can be resolved no matter which language `label`
 * is currently rendered in.
 *
 * `countsBySlug` (from `GET /api/Categories/counts-by-slug`, computed with the exact same
 * category query the search endpoint uses per slug) is preferred over the label-based lookup
 * above whenever it has an entry for the node: it is numeric-slug-keyed and already exact for
 * the node's WHOLE subtree, so it must never be added to a rolled-up child count on top of
 * itself. It is `null`/absent when the endpoint hasn't loaded yet or the API doesn't have it
 * (older deployment) — every function below falls back to the label-based logic in that case.
 */

export interface CategoryCountNode {
  slug: string
  label?: string | null
  subCategories?: CategoryCountNode[] | null
}

export type CategoryCountsMap = Record<string, number>
export type CategoryCountsBySlugMap = Record<string, number> | null | undefined

/** Lowercase every key of a raw counts map so lookups are case-insensitive. */
export function normalizeCategoryCounts(raw: Record<string, number>): CategoryCountsMap {
  const normalized: CategoryCountsMap = {}
  for (const [key, count] of Object.entries(raw)) {
    normalized[key.toLowerCase()] = count
  }
  return normalized
}

/**
 * Resolve the product count for a single category node (not including subcategories).
 * Prefers `countsBySlug` (see module docs), then the node's German label (via
 * `germanLabelBySlug`) so the label-based lookup is independent of the UI language, then falls
 * back to the node's own label, then 0 when nothing matches.
 */
export function resolveCategoryCount(
  node: { slug: string, label?: string | null },
  counts: CategoryCountsMap,
  germanLabelBySlug: Record<string, string> = {},
  countsBySlug: CategoryCountsBySlugMap = null,
): number {
  const authoritative = countsBySlug ? countsBySlug[node.slug] : undefined
  if (authoritative !== undefined) {
    return authoritative
  }
  const germanLabel = germanLabelBySlug[node.slug]
  const labelCount = germanLabel
    ? (counts[germanLabel.toLowerCase()] ?? 0)
    : (node.label ? (counts[node.label.toLowerCase()] ?? 0) : 0)
  const slugCount = counts[node.slug.toLowerCase()] ?? 0
  return slugCount + labelCount
}

/**
 * Total product count for a category, rolled up across all of its subcategories
 * (any depth), independent of the UI language. When `countsBySlug` has an entry for this node,
 * that value is returned as-is (it already covers the whole subtree) instead of summing children.
 */
export function getCategoryProductCount(
  node: CategoryCountNode,
  counts: CategoryCountsMap,
  germanLabelBySlug: Record<string, string> = {},
  countsBySlug: CategoryCountsBySlugMap = null,
): number {
  const authoritative = countsBySlug ? countsBySlug[node.slug] : undefined
  if (authoritative !== undefined) {
    return authoritative
  }
  let total = resolveCategoryCount(node, counts, germanLabelBySlug, countsBySlug)
  if (node.subCategories) {
    for (const sub of node.subCategories) {
      total += getCategoryProductCount(sub, counts, germanLabelBySlug, countsBySlug)
    }
  }
  return total
}

/**
 * Number of a category's DIRECT subcategories that actually have products (rolled up across
 * their own descendants, independent of the UI language). A subcategory tree taken straight
 * from the taxonomy API can list children that have zero matching listings (e.g. Google-taxonomy
 * categories like "Suits" or "Baby & Toddler Clothing" under "Clothing") — showing "N
 * subcategories" for those, then landing on an all-empty browse page after the click, is
 * confusing. This is what the "N subcategories" badge and the click-through decision should
 * both count instead of the raw `subCategories.length`.
 */
export function countPopulatedSubCategories(
  node: CategoryCountNode,
  counts: CategoryCountsMap,
  germanLabelBySlug: Record<string, string> = {},
  countsBySlug: CategoryCountsBySlugMap = null,
): number {
  if (!node.subCategories) return 0
  return node.subCategories.filter(sub => getCategoryProductCount(sub, counts, germanLabelBySlug, countsBySlug) > 0).length
}

/** Format a product count for display, e.g. 2400 -> "2.4k". */
export function formatCategoryCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toString()
}
