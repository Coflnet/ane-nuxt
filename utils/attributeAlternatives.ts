/**
 * Pure helpers for the attribute chips of the filter tree (pages/filters/create.vue).
 *
 * A chip is a catalogue attribute value the user picked ("256GB", "Blau"). Listings spell
 * those values in many ways, so each pick is expanded into match alternatives
 * ("256 gb"; "blau" | "blue") and sent as one wire filter:
 *   `{ name: 'Attributes', value: 'storage=256 gb;color=blau|blue' }`
 * `;` joins keys (AND), `|` joins alternatives of one key (OR).
 */

/** Attribute keys that usually appear in a listing title, so matching them is meaningful. */
export const TITLE_ATTRIBUTE_KEYS = [
  'storage', 'ram', 'memory', 'size', 'color', 'colour', 'screen_size', 'model',
  'edition', 'media_format', 'console_name', 'language',
] as const

export const MAX_ATTRIBUTE_KEYS = 8
export const MAX_ALTERNATIVES_PER_KEY = 12
export const MAX_ALTERNATIVE_LENGTH = 60

/** Selected chip values per attribute key, as the user picked them (display spelling). */
export type AttributeSelection = Record<string, string[]>

const COLOUR_KEYS = new Set(['color', 'colour'])

/** Each row lists spellings of one colour; the first is the English name. */
const COLOUR_GROUPS: string[][] = [
  ['black', 'schwarz'],
  ['white', 'weiß', 'weiss'],
  ['blue', 'blau'],
  ['red', 'rot'],
  ['green', 'grün', 'gruen'],
  ['silver', 'silber'],
  ['gold'],
  ['grey', 'gray', 'grau'],
  ['yellow', 'gelb'],
  ['pink', 'rosa'],
  ['purple', 'lila', 'violett'],
  ['brown', 'braun'],
  ['orange'],
  ['beige'],
]

const NUMBER_WITH_UNIT = /^(\d+(?:[.,]\d+)?)\s*([a-z]{1,5})$/i

/** Removes the wire separators and squeezes whitespace. */
export function cleanAttributeText(value: string): string {
  return value.replace(/[;|=]/g, ' ').replace(/\s+/g, ' ').trim()
}

function cleanKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9_]/g, '')
}

function normalizeValue(value: string): string {
  const raw = cleanAttributeText(value).toLowerCase()
  const unit = NUMBER_WITH_UNIT.exec(raw)
  if (!unit) return raw
  return `${unit[1]!.replace(',', '.')} ${unit[2]}`
}

function colourGroup(value: string): string[] | undefined {
  return COLOUR_GROUPS.find(group => group.includes(value))
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

/** All spellings a listing may use for `value` of attribute `key`, the normalised value first. */
export function attributeAlternatives(key: string, value: string): string[] {
  const normalized = normalizeValue(value).slice(0, MAX_ALTERNATIVE_LENGTH)
  if (!normalized) return []
  if (!COLOUR_KEYS.has(cleanKey(key))) return [normalized]
  return unique([normalized, ...(colourGroup(normalized) ?? [])])
}

function sharesAlternative(key: string, a: string, b: string): boolean {
  const left = attributeAlternatives(key, a)
  return attributeAlternatives(key, b).some(alt => left.includes(alt))
}

/** True when `value` (a bucket value) is already covered by the selection of `key`. */
export function isAttributeSelected(selection: AttributeSelection, key: string, value: string): boolean {
  return (selection[key] ?? []).some(selected => sharesAlternative(key, selected, value))
}

/** Returns a new selection with `value` toggled for `key` (multi-select per key). */
export function toggleAttribute(selection: AttributeSelection, key: string, value: string): AttributeSelection {
  const current = selection[key] ?? []
  const next = isAttributeSelected(selection, key, value)
    ? current.filter(selected => !sharesAlternative(key, selected, value))
    : [...current, value]
  const others = Object.fromEntries(Object.entries(selection).filter(([name]) => name !== key))
  return next.length ? { ...others, [key]: next } : others
}

/** Alternatives of the values that fit the per-key limit; a value is taken whole or not at all. */
function fittingAlternatives(key: string, values: string[]): string[] {
  let taken: string[] = []
  for (const value of values) {
    const merged = unique([...taken, ...attributeAlternatives(key, value)])
    if (merged.length <= MAX_ALTERNATIVES_PER_KEY) taken = merged
  }
  return taken
}

function encodeKey(key: string, values: string[]): string {
  const alternatives = fittingAlternatives(key, values)
  return alternatives.length ? `${key}=${alternatives.join('|')}` : ''
}

function encodedParts(selection: AttributeSelection): string[] {
  return Object.entries(selection)
    .map(([key, values]) => encodeKey(cleanKey(key), values ?? []))
    .filter(Boolean)
}

/** Encodes the selection into the `Attributes` wire value ('' when nothing is selected). */
export function encodeAttributes(selection: AttributeSelection): string {
  return encodedParts(selection).slice(0, MAX_ATTRIBUTE_KEYS).join(';')
}

/**
 * True when picking `value` for `key` still fits the wire limits (8 keys, 12 alternatives per
 * key after colour expansion). Values that are already selected can always be toggled off.
 */
export function canAddValue(selection: AttributeSelection, key: string, value: string): boolean {
  if (isAttributeSelected(selection, key, value)) return true
  const added = attributeAlternatives(key, value)
  if (!added.length) return false
  const current = (selection[key] ?? []).flatMap(selected => attributeAlternatives(key, selected))
  if (unique([...current, ...added]).length > MAX_ALTERNATIVES_PER_KEY) return false
  return current.length > 0 || encodedParts(selection).length < MAX_ATTRIBUTE_KEYS
}

/** Folds alternatives that spell the same value back into one chip each. */
function collapseAlternatives(key: string, alternatives: string[]): string[] {
  const chips: string[] = []
  for (const alternative of alternatives) {
    if (!chips.some(chip => sharesAlternative(key, chip, alternative))) chips.push(alternative)
  }
  return chips
}

/** Decodes an `Attributes` wire value back into chips; malformed parts are skipped. */
export function decodeAttributes(value: string | null | undefined): AttributeSelection {
  const selection: AttributeSelection = {}
  for (const part of (value ?? '').split(';')) {
    const [rawKey, rawAlternatives] = part.split('=')
    const key = cleanKey(rawKey ?? '')
    const alternatives = unique((rawAlternatives ?? '').split('|').map(cleanAttributeText))
    if (!key || !alternatives.length) continue
    selection[key] = collapseAlternatives(key, alternatives)
  }
  return selection
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function tokenSpellings(key: string, value: string): string[] {
  const alternatives = attributeAlternatives(key, value)
  return unique([...alternatives, ...alternatives.map(alt => alt.replace(/\s+/g, '')), cleanAttributeText(value).toLowerCase()])
    .sort((a, b) => b.length - a.length)
}

/**
 * Removes the words that became chips from the free-text query, so the SearchTerm does not
 * require them twice. Keeps the original query when nothing would be left.
 */
export function stripAttributeTokens(query: string, selection: AttributeSelection): string {
  let result = ` ${query} `
  for (const [key, values] of Object.entries(selection)) {
    for (const spelling of (values ?? []).flatMap(value => tokenSpellings(key, value))) {
      result = result.replace(new RegExp(`(?<=\\s)${escapeRegExp(spelling)}(?=\\s)`, 'giu'), ' ')
    }
  }
  const stripped = result.replace(/\s+/g, ' ').trim()
  return stripped || query.trim()
}

/** Keeps only whitelisted, title-visible keys with at least one non-empty value. */
export function titleVisibleKeys(keys: string[]): string[] {
  return TITLE_ATTRIBUTE_KEYS.filter(key => keys.includes(key))
}
