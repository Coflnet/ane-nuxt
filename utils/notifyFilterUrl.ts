/**
 * Pure helpers for the "Notify me about new offers" button on a product page.
 *
 * It links to `/filters/create` prefilled from the product being viewed, so the
 * new-filter form (see utils/filterPrefill.ts) doesn't start blank.
 */

export interface NotifyFilterProduct {
  brand?: string | null
  name?: string | null
  avgPrice?: number | null
}

/**
 * Combine brand + product name into a single search value without duplicating the
 * brand when the name already starts with it — e.g. brand "Realme", name "Realme
 * Yellow" should produce "Realme Yellow", not "Realme Realme Yellow".
 */
export function buildNotifySearchValue(product: NotifyFilterProduct): string {
  const brand = product.brand?.trim() ?? ''
  const name = product.name?.trim() ?? ''
  if (!brand) return name
  if (!name) return brand
  return name.toLowerCase().startsWith(brand.toLowerCase()) ? name : `${brand} ${name}`
}

/**
 * Build the `{ path, query }` for the "Notify me" link. `query` only ever contains
 * the params `utils/filterPrefill.ts` knows how to read — minPrice is intentionally
 * left out (the task is "let me know about ANY new offer", not "only cheap ones").
 */
export function buildNotifyFilterUrl(product: NotifyFilterProduct): { path: string, query: Record<string, string> } {
  const query: Record<string, string> = {}

  const searchValue = buildNotifySearchValue(product)
  if (searchValue) query.searchValue = searchValue

  if (product.avgPrice != null && Number.isFinite(product.avgPrice) && product.avgPrice > 0) {
    query.maxPrice = String(Math.round(product.avgPrice))
  }

  return { path: '/filters/create', query }
}
