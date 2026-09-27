/**
 * Pure helper for resolving the `category` value sent to `GET /api/product/search`.
 *
 * The search API currently only matches `category=<German taxonomy label>` (e.g.
 * "Bekleidung", "Elektronik") — it returns 0 results for a numeric slug ("1604")
 * or an English label ("clothing"/"Clothing"). `useCategories()` already maps a
 * numeric slug to its German label via `germanLabelBySlug` (fetched once from
 * `/api/Categories/top-level?lang=de`, independent of the UI language), so this
 * resolves that label when it's known and falls back to the same value the page
 * sent before (the numeric/API slug) when it isn't — e.g. before the German
 * labels have loaded, or for a category outside the known taxonomy.
 */

/**
 * @param rawCategory The category value from the URL — may be a URL-friendly slug
 *   ("clothing"), a numeric slug ("1604") or already a German label ("Bekleidung").
 * @param urlToNumeric Map from URL-friendly slug to numeric slug (`useCategories().urlToNumeric`).
 * @param germanLabelBySlug Map from numeric slug to German label (`useCategories().germanLabelBySlug`).
 * @returns The German label when resolvable, otherwise the numeric/API slug (today's behaviour).
 */
export function resolveSearchCategoryParam(
  rawCategory: string,
  urlToNumeric: Record<string, string>,
  germanLabelBySlug: Record<string, string>,
): string {
  if (!rawCategory) return rawCategory
  const apiSlug = urlToNumeric[rawCategory] || rawCategory
  return germanLabelBySlug[apiSlug] || apiSlug
}
