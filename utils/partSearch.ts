export const partClasses = ['gear', 'bearing', 'sprocket', 'pulley', 'generic'] as const
export const partFields = ['q', 'partNumber', 'machine', 'part_key', 'teeth', 'outerDiameterMm', 'boreMm', 'innerDiameterMm', 'module', 'widthMm', 'teeth_observed', 'arc_degrees', 'pitch_mm', 'tolerance', 'toleranceMm'] as const
export type PartField = typeof partFields[number]
export type PartForm = Record<PartField, string> & { class: string, mode: string }

export function partFormFromQuery(query: Record<string, unknown>): PartForm {
  const value = (key: string) => typeof query[key] === 'string' ? query[key] as string : ''
  return {
    ...Object.fromEntries(partFields.map(key => [key, value(key)])),
    class: partClasses.includes(value('class') as typeof partClasses[number]) ? value('class') : '',
    mode: value('mode') === 'fragment' || value('teeth_observed') ? 'fragment' : 'full',
    tolerance: value('tolerance') || '0.02',
    toleranceMm: value('toleranceMm') || '0.2',
  } as PartForm
}

/** Only search criteria enter a shared URL. Photos never enter route or persistent storage. */
export function partSearchParams(form: PartForm): Record<string, string> {
  const query: Record<string, string> = form.class ? { class: form.class } : {}
  const numeric = new Set<PartField>(['teeth', 'outerDiameterMm', 'boreMm', 'innerDiameterMm', 'module', 'widthMm', 'teeth_observed', 'arc_degrees', 'pitch_mm', 'tolerance', 'toleranceMm'])
  const toothed = ['', 'gear', 'sprocket', 'pulley'].includes(form.class)
  for (const key of partFields) {
    if (['teeth', 'module', 'teeth_observed', 'arc_degrees', 'pitch_mm'].includes(key) && !toothed) continue
    if (key === 'boreMm' && form.class === 'bearing') continue
    if (key === 'innerDiameterMm' && form.class !== 'bearing') continue
    if (key === 'part_key' && form.class !== 'bearing') continue
    if (['teeth_observed', 'arc_degrees'].includes(key) && form.mode !== 'fragment') continue
    if (key === 'teeth' && form.mode === 'fragment') continue
    const value = String(form[key] ?? '').trim()
    if (value) query[key] = numeric.has(key) ? value.replace(',', '.') : value
  }
  if (toothed && form.mode === 'fragment') query.mode = 'fragment'
  return query
}

export interface PartHit {
  id: string
  name: string
  imageUrl?: string
  minPrice?: number
  listingCount: number
  teeth?: number
  outerDiameterMm?: number
  boreMm?: number
  innerDiameterMm?: number
  widthMm?: number
  module?: number
  partNumber?: string
  material?: string
  fits: string[]
  via: string
  viaEvidence?: string
}

export interface PartResults {
  query: Record<string, string | number | null>
  estimate?: { teeth: number, min: number, max: number }
  items: PartHit[]
}

export interface GearPhotoEstimate {
  teeth?: number
  verified: boolean
  confidence: number
  teethObserved?: number
  arcDegrees?: number
  teethEstimatedFromFragment?: number
}
