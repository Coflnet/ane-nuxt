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
