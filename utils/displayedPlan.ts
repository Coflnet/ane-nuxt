/**
 * The plan the subscriptions page marks as current: the user's highest tier however it was obtained
 * (subscription or manual grant). The end date belongs to whichever source gives that tier.
 */
export type DisplayedPlanId = 'basic' | 'collector' | 'flipper'

export interface DisplayedPlan {
  id: DisplayedPlanId
  endDate: Date | null
}

interface SubscriptionLike { product?: string | null, endsAt?: string | null }
interface AccessLike { tier?: string | null, until?: string | Date | null }

const rank: Record<DisplayedPlanId, number> = { basic: 0, collector: 1, flipper: 2 }

function toPlanId(tier: string | null | undefined): DisplayedPlanId {
  return tier === 'flipper' || tier === 'collector' ? tier : 'basic'
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null
  return new Date(value)
}

export function displayedPlan(subscription: SubscriptionLike | null | undefined, access: AccessLike | null | undefined): DisplayedPlan {
  const subscribed = toPlanId(subscription?.product)
  const effective = toPlanId(access?.tier)
  if (rank[effective] > rank[subscribed])
    return { id: effective, endDate: toDate(access?.until) }
  return { id: subscribed, endDate: toDate(subscription?.endsAt) }
}
