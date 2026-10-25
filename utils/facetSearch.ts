/** Repeated URL parameters represent literal alternatives; values are never split on commas. */
export function attributeValues(value: unknown): string[] {
  return [...new Set((Array.isArray(value) ? value : [value]).filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))]
}

export function toggleAttributeValue(query: Record<string, string | string[]>, key: string, value: string) {
  const param = `attr_${key}`
  const selected = attributeValues(query[param])
  const values = selected.includes(value) ? selected.filter(entry => entry !== value) : [...selected, value]
  const next = Object.fromEntries(Object.entries(query).filter(([key]) => key !== param))
  if (values.length) next[param] = values.length === 1 ? values[0]! : values
  return next
}

/** Keep the search scope while discovering alternatives to a field's own selected value. */
export function facetSearchParams(
  params: Record<string, string | number | string[]>,
  key: string,
  query: string,
) {
  const attributes = Array.isArray(params.attributes) ? params.attributes : []
  return {
    ...params,
    offset: 0,
    limit: 0,
    attributes: attributes.filter(value => value.split(':', 1)[0]?.toLowerCase() !== key.toLowerCase()),
    facetKey: key,
    facetQuery: query,
  }
}
