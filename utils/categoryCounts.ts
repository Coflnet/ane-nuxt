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
 */

export interface CategoryCountNode {
  slug: string
  label?: string | null
  subCategories?: CategoryCountNode[] | null
}

export type CategoryCountsMap = Record<string, number>

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
 * Prefers the node's German label (via `germanLabelBySlug`) so the lookup is independent
 * of the UI language; falls back to the node's own label, then 0 when nothing matches.
 */
export function resolveCategoryCount(
  node: { slug: string, label?: string | null },
  counts: CategoryCountsMap,
  germanLabelBySlug: Record<string, string> = {},
): number {
  const germanLabel = germanLabelBySlug[node.slug]
  const labelCount = germanLabel
    ? (counts[germanLabel.toLowerCase()] ?? 0)
    : (node.label ? (counts[node.label.toLowerCase()] ?? 0) : 0)
  const slugCount = counts[node.slug.toLowerCase()] ?? 0
  return slugCount + labelCount
}

/**
 * Total product count for a category, rolled up across all of its subcategories
 * (any depth), independent of the UI language.
 */
export function getCategoryProductCount(
  node: CategoryCountNode,
  counts: CategoryCountsMap,
  germanLabelBySlug: Record<string, string> = {},
): number {
  let total = resolveCategoryCount(node, counts, germanLabelBySlug)
  if (node.subCategories) {
    for (const sub of node.subCategories) {
      total += getCategoryProductCount(sub, counts, germanLabelBySlug)
    }
  }
  return total
}

/** Format a product count for display, e.g. 2400 -> "2.4k". */
export function formatCategoryCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toString()
}
