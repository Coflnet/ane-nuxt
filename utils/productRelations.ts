/**
 * Localized names and related pages of a product: other language editions of a game, the empty case page of a
 * game and the game of a case page. The endpoint (`GET /api/Product/{id}/relations`) is not in the generated
 * client (that is built from the live spec, which only has it after the API deployed), so it is called directly
 * and every caller treats a failed request as "no relations".
 */

export interface ProductPageRef {
  id: string
  name: string
}

export interface ProductEdition extends ProductPageRef {
  language?: string | null
}

export interface ProductRelations {
  localizedNames: Record<string, string>
  productKind?: string | null
  caseOf?: ProductPageRef | null
  casePages: ProductPageRef[]
  editions: ProductEdition[]
}

export const GAME_CASE_KIND = 'game_case'
export const CASE_NAME_MARKER = 'empty case, no game'

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  es: 'Español',
}

export function buildRelationsUrl(base: string, id: string): string {
  return `${base}/api/Product/${encodeURIComponent(id)}/relations`
}

/** Never throws, answers 404 or any other failure with null so the page simply has no section. */
export async function fetchProductRelations(
  base: string,
  id: string,
  fetcher: (url: string) => Promise<unknown>,
): Promise<ProductRelations | null> {
  try {
    return normalizeRelations(await fetcher(buildRelationsUrl(base, id)))
  }
  catch {
    return null
  }
}

export function normalizeRelations(raw: unknown): ProductRelations | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<ProductRelations>
  const pageRef = (p: unknown): p is ProductPageRef => !!p && typeof (p as ProductPageRef).id === 'string' && (p as ProductPageRef).id !== ''
  return {
    localizedNames: r.localizedNames && typeof r.localizedNames === 'object' ? r.localizedNames : {},
    productKind: r.productKind ?? null,
    caseOf: pageRef(r.caseOf) ? r.caseOf : null,
    casePages: Array.isArray(r.casePages) ? r.casePages.filter(pageRef) : [],
    editions: Array.isArray(r.editions) ? r.editions.filter(pageRef) : [],
  }
}

type AttributeBag = Record<string, string> | { key?: string | null, value?: string | null }[] | null | undefined

function attributeValue(attributes: AttributeBag, key: string): string | undefined {
  if (!attributes) return undefined
  if (Array.isArray(attributes)) return attributes.find(a => a?.key === key)?.value ?? undefined
  return attributes[key]
}

/** A page that sells only the empty case of a game: the attribute, or the marker in the name for pages indexed before it. */
export function isGameCaseProduct(product: { name?: string | null, attributes?: AttributeBag } | null | undefined): boolean {
  if (!product) return false
  return attributeValue(product.attributes, 'product_kind') === GAME_CASE_KIND
    || (product.name ?? '').toLowerCase().includes(CASE_NAME_MARKER)
}

/** The game page id a case page names in its attributes, usable before the relations answered. */
export function caseOfId(product: { attributes?: AttributeBag } | null | undefined): string | null {
  return attributeValue(product?.attributes, 'case_of') || null
}

/** The name in the visitor's language when the product has one that differs from the page title. */
export function localizedSubtitle(names: Record<string, string> | null | undefined, locale: string, title?: string | null): string | null {
  const name = names?.[locale.toLowerCase().split('-')[0] ?? '']?.trim()
  return name && name !== (title ?? '').trim() ? name : null
}

/** Language label in that language ("Deutsch", "Italiano"); the upper case code for an unknown language, null without one. */
export function editionLanguageLabel(language: string | null | undefined): string | null {
  if (!language) return null
  const code = language.toLowerCase()
  return LANGUAGE_NAMES[code] ?? code.toUpperCase()
}

/** Title of a case page: the name in the visitor's language when present, else the page name. */
export function caseTitle(name: string, names: Record<string, string> | null | undefined, locale: string): string {
  return localizedSubtitle(names, locale, name) ?? name
}
