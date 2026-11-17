/**
 * Pure helpers for the "Looking for a replacement part?" card on /search. The backend
 * flags part-like queries (`interpretation.isPartQuery`) and returns the details it read
 * (`interpretation.partHints`); these carry over to the /parts finder prefill, using the
 * exact keys `partFormFromQuery` (utils/partSearch.ts) reads.
 */
import { partClasses } from './partSearch.ts'

export interface PartHints {
  partClass?: string | null
  teeth?: number | null
  boreMm?: number | null
  outerDiameterMm?: number | null
  innerDiameterMm?: number | null
  widthMm?: number | null
  module?: number | null
  partNumber?: string | null
  partKey?: string | null
  machine?: string | null
  position?: string | null
  rimType?: string | null
}

/** Hint field → /parts query key. Order is also the chip order. */
const CARRIED_FIELDS = [
  ['teeth', 'teeth'],
  ['boreMm', 'boreMm'],
  ['outerDiameterMm', 'outerDiameterMm'],
  ['innerDiameterMm', 'innerDiameterMm'],
  ['widthMm', 'widthMm'],
  ['module', 'module'],
  ['partNumber', 'partNumber'],
  ['partKey', 'part_key'],
  ['machine', 'machine'],
] as const satisfies readonly (readonly [keyof PartHints, string])[]

export interface PartHintChip {
  /** i18n key under `searchMore.chips` (or `parts.classes.*` for the part class) */
  key: string
  value: string
}

function hintText(value: string | number | null | undefined): string {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? String(value) : ''
  return typeof value === 'string' ? value.trim() : ''
}

function validClass(partClass: string | null | undefined): string {
  const value = (partClass ?? '').trim().toLowerCase()
  return (partClasses as readonly string[]).includes(value) ? value : ''
}

/** Query for `/parts`: the typed text plus every recognised hint; empty values are omitted. */
export function partsFinderQuery(searchQuery: string, hints?: PartHints | null): Record<string, string> {
  const query: Record<string, string> = {}
  const q = searchQuery.trim()
  if (q) query.q = q
  const partClass = validClass(hints?.partClass)
  if (partClass) query.class = partClass
  for (const [field, param] of CARRIED_FIELDS) {
    const value = hintText(hints?.[field])
    if (value) query[param] = value
  }
  return query
}

/** Chips describing the hints that carry over, e.g. Gear · 42 teeth · 8 mm bore. */
export function partHintChips(hints?: PartHints | null): PartHintChip[] {
  const chips: PartHintChip[] = []
  const partClass = validClass(hints?.partClass)
  if (partClass) chips.push({ key: `parts.classes.${partClass}`, value: partClass })
  for (const [field] of CARRIED_FIELDS) {
    const value = hintText(hints?.[field])
    if (value) chips.push({ key: `searchMore.chips.${field}`, value })
  }
  return chips
}

/** Session key under which a "Not a part" dismissal is remembered for one query. */
export function partsSuggestionDismissKey(searchQuery: string): string {
  return `ane:partsSuggestionDismissed:${searchQuery.trim().toLowerCase().replace(/\s+/g, ' ')}`
}
