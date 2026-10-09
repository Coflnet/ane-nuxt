/**
 * Route query for a submitted search box value. An empty (or whitespace-only) submit has no `q`,
 * which makes /search show the category browser instead of doing nothing.
 */
export function searchRouteQuery(raw: string | null | undefined): Record<string, string> {
  const q = (raw ?? '').trim()
  return q ? { q } : {}
}
