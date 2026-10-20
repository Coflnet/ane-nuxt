// AneNotifier's SearchState is a [Flags] enum serialized as strings, combined flags arrive
// comma separated ("Disabled, DisabledInactive"); a number is accepted as well
const flagValues: Record<string, number> = {
  None: 0,
  Disabled: 1,
  DisabledError: 2,
  DisabledInactive: 4,
}

function toFlagNames(bits: number): string[] {
  return Object.keys(flagValues).filter(name => flagValues[name]! & bits)
}

/** The flag names set on a filter's `state` */
export function parseSearchState(state: string | number | null | undefined): string[] {
  if (typeof state === 'number')
    return toFlagNames(state)
  return (state ?? '').split(',').map(name => name.trim()).filter(name => name && name !== 'None')
}

/** Paused because the user had no activity on the website for 30 days */
export function isPausedForInactivity(state: string | number | null | undefined): boolean {
  return parseSearchState(state).includes('DisabledInactive')
}

/** Switched off by the notifier after notifications kept failing */
export function isDisabledByError(state: string | number | null | undefined): boolean {
  return parseSearchState(state).includes('DisabledError')
}

/** The state to save on reactivation: only the inactivity pause is cleared, other flags stay */
export function withoutInactivityPause(state: string | number | null | undefined): string {
  const remaining = parseSearchState(state).filter(name => name !== 'DisabledInactive')
  return remaining.length ? remaining.join(', ') : 'None'
}
