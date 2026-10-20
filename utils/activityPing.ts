// Notification filters of users without website activity for 30 days are paused by AneNotifier,
// the website reports activity at most once per hour and user per browser
export const activityPingIntervalMs = 60 * 60 * 1000

const storageKey = 'ane-activity-ping'

type PingStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface ActivityPingDeps {
  storage: PingStorage | null
  now: () => number
  send: (token: string) => Promise<unknown>
}

/** Short fingerprint, so a different login pings again without storing the token a second time */
function fingerprint(token: string): string {
  let hash = 0x811C9DC5
  for (let i = 0; i < token.length; i++)
    hash = Math.imul(hash ^ token.charCodeAt(i), 0x01000193)
  return (hash >>> 0).toString(36)
}

interface LastPing { user?: string, at?: number }

// kept for this page load as well, where storage is blocked, full or throws
let lastPingInMemory: LastPing = {}

function readStoredPing(storage: PingStorage | null): LastPing {
  try {
    return JSON.parse(storage?.getItem(storageKey) ?? '{}') ?? {}
  }
  catch {
    return {}
  }
}

/** The newer of the stored and the in-memory record, the stored one is outdated when writing it failed */
function readLastPing(storage: PingStorage | null): LastPing {
  const stored = readStoredPing(storage)
  return (stored.at ?? -Infinity) >= (lastPingInMemory.at ?? -Infinity) ? stored : lastPingInMemory
}

function writeLastPing(storage: PingStorage | null, user: string, at: number) {
  lastPingInMemory = { user, at }
  try {
    storage?.setItem(storageKey, JSON.stringify(lastPingInMemory))
  }
  catch {
    // storage full or blocked, the in-memory record still debounces this page load
  }
}

/** Sends the activity ping unless this user was reported within the last hour; never throws or waits for the request */
export function pingActivity(token: string | null | undefined, { storage, now, send }: ActivityPingDeps): boolean {
  if (!token)
    return false
  const user = fingerprint(token)
  const last = readLastPing(storage)
  if (last.user === user && typeof last.at === 'number' && now() - last.at < activityPingIntervalMs)
    return false
  // recorded before sending so renders in quick succession do not ping twice
  writeLastPing(storage, user, now())
  send(token).catch(() => {})
  return true
}
