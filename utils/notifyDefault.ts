/**
 * Picks the notification channel a NEW filter starts with, so most users never have to
 * open the Notify branch. Order: the newest existing filter's channel, push inside the app,
 * email when signed in, a saved Discord webhook, otherwise none.
 */
import type { TargetType } from '../types/FilterType.ts'

export interface NotifyDefaultInput {
  filters: { id?: number | null, targetType?: string | null, target?: string | null }[]
  isWebView: boolean
  /** Push works without a new permission prompt (app, or browser permission already granted). */
  pushAllowed: boolean
  isLoggedIn: boolean
  savedEmail?: string | null
  accountEmail?: string | null
  savedDiscordWebhook?: string | null
}

export interface NotifyDefault {
  type: TargetType
  target: string
  /** True when derived from the user's settings or filters ("your settings" tag). */
  derived: boolean
}

const UNKNOWN_TYPES = new Set(['Unknown', 'UnknownDefaultOpenApi', '', undefined, null])
const NONE: NotifyDefault = { type: 'Unknown', target: '', derived: false }

function newestFilterChannel(filters: NotifyDefaultInput['filters'], pushAllowed: boolean): NotifyDefault | null {
  const newest = [...filters].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))[0]
  if (!newest || UNKNOWN_TYPES.has(newest.targetType)) return null
  // Push from another device would need a permission prompt here; fall through instead.
  if (newest.targetType === 'FireBase' && !pushAllowed) return null
  return { type: newest.targetType as TargetType, target: newest.target ?? '', derived: true }
}

export function pickDefaultNotification(input: NotifyDefaultInput): NotifyDefault {
  const fromFilter = newestFilterChannel(input.filters, input.pushAllowed)
  if (fromFilter) return fromFilter
  if (input.isWebView) return { type: 'FireBase', target: '-', derived: true }
  const email = (input.savedEmail || input.accountEmail || '').trim()
  if (input.isLoggedIn && email) return { type: 'Email', target: email, derived: true }
  const webhook = (input.savedDiscordWebhook ?? '').trim()
  if (webhook) return { type: 'DiscordWebhook', target: webhook, derived: true }
  return NONE
}
