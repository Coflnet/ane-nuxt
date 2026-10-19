export type TokenUnsubscribeStep = 'invalid' | 'confirm' | 'pending' | 'done' | 'error'

export interface TokenUnsubscribeState {
  step: TokenUnsubscribeStep
  filterName: string
  loadFailed: boolean
}

export interface TokenUnsubscribeApi {
  /** Reads the filter the e-mail link points at, only to show its name */
  load: () => Promise<{ name?: string | null } | null | undefined>
  /** Deletes the filter, only called after the user confirmed */
  remove: () => Promise<unknown>
}

/**
 * Backs the e-mail unsubscribe and edit links (`/unsubscribe/{id}?token=`, `/edit/{id}?token=`).
 * Opening the link only loads the filter name: mail scanners prefetch these GET links, so the
 * filter is deleted solely by `confirmUnsubscribe`, which the page binds to an explicit button.
 * The functions mutate the passed state so a page can hand in a `reactive()` object.
 */
export function createTokenUnsubscribeState(hasToken: boolean): TokenUnsubscribeState {
  return { step: hasToken ? 'confirm' : 'invalid', filterName: '', loadFailed: false }
}

export async function loadTokenFilterName(state: TokenUnsubscribeState, api: TokenUnsubscribeApi) {
  if (state.step === 'invalid')
    return
  try {
    state.filterName = (await api.load())?.name ?? ''
  }
  catch {
    // unsubscribe tokens may not read the filter, the confirmation then omits its name
    state.loadFailed = true
  }
}

export async function confirmUnsubscribe(state: TokenUnsubscribeState, api: TokenUnsubscribeApi) {
  if (state.step !== 'confirm' && state.step !== 'error')
    return
  state.step = 'pending'
  try {
    await api.remove()
    state.step = 'done'
  }
  catch {
    state.step = 'error'
  }
}
