export const AVAILABILITY_TIMEOUT_MS = 2500

export type AvailabilityResult = 'available' | 'unavailable' | 'timeout' | 'error'

export type OpenDecision
  /** No tab could be opened up front: leave the click alone so the anchor navigates normally. */
  = | 'anchor-navigate'
  /** Send the already opened tab to the listing. */
    | 'navigate-tab'
  /** Listing is gone: close the blank tab and tell the user on the row. */
    | 'close-tab-mark-unavailable'

/** Only a plain primary-button click goes through the check; modified clicks keep native link behaviour. */
export function isPlainLeftClick(e: { button?: number, metaKey?: boolean, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean, defaultPrevented?: boolean }): boolean {
  return (e.button ?? 0) === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented
}

/**
 * What to do once the availability check finished. Timeouts and errors count as available so
 * a slow or broken check never blocks the user from reaching the listing.
 */
export function decideOpen(popupOpened: boolean, result: AvailabilityResult): OpenDecision {
  if (!popupOpened) return 'anchor-navigate'
  return result === 'unavailable' ? 'close-tab-mark-unavailable' : 'navigate-tab'
}

/** Resolve the availability check to a result within `ms`, never rejecting. */
export async function runAvailabilityCheck(check: () => Promise<boolean>, ms: number = AVAILABILITY_TIMEOUT_MS): Promise<AvailabilityResult> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<AvailabilityResult>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms)
  })
  const run = check().then<AvailabilityResult, AvailabilityResult>(ok => (ok ? 'available' : 'unavailable'), () => 'error')
  try {
    return await Promise.race([run, timeout])
  }
  finally {
    clearTimeout(timer)
  }
}
