export const HISTORY_WINDOWS = [7, 30, 90, 365] as const

export function parseHistoryDays(value: unknown): number {
  return typeof value === 'string' && HISTORY_WINDOWS.some(days => String(days) === value) ? Number(value) : 90
}

type Snapshot = { date?: string, currency?: string | null }

export function historyCurrency(history: Snapshot[]): string | null {
  const currency = history[0]?.currency
  return currency && history.every(point => point.currency === currency) ? currency : null
}

export function formatHistoryPrice(amount: number, currency: string | null, locale: string): string {
  return new Intl.NumberFormat(locale, currency
    ? { style: 'currency', currency }
    : { maximumFractionDigits: 2 }).format(amount)
}

/** History is chronological; gaps between recorded days retain their actual width. */
export function historyTimeFraction(history: Snapshot[], index: number): number {
  const first = Date.parse(history[0]?.date ?? '')
  const last = Date.parse(history.at(-1)?.date ?? '')
  if (history.length <= 1 || last === first) return 0.5
  return (Date.parse(history[index]?.date ?? '') - first) / (last - first)
}

/** Only an explicit three-letter currency certifies a daily snapshot. Never infer legacy NULL rows. */
export function parseHistoryCurrency(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value.trim().toUpperCase()) ? value.trim().toUpperCase() : null
}

export function historyCurrencies(history: Snapshot[]): string[] {
  const days = new Map<string, number>()
  for (const point of history) {
    const code = parseHistoryCurrency(point.currency)
    if (code) days.set(code, (days.get(code) ?? 0) + 1)
  }
  return [...days.keys()].sort((a, b) => days.get(b)! - days.get(a)! || a.localeCompare(b))
}

export function chooseHistoryCurrency(history: Snapshot[], preferred?: unknown): string | null {
  const currencies = historyCurrencies(history)
  const code = parseHistoryCurrency(preferred)
  return code && currencies.includes(code) ? code : currencies[0] ?? null
}

export function selectHistoryCurrency<T extends Snapshot>(history: T[], currency: string | null): T[] {
  return currency ? history.filter(point => parseHistoryCurrency(point.currency) === currency) : []
}
