export interface Feature {
  text: string
  amount?: number
  included: boolean
}

export interface Plan {
  id: PlanId
  name: string
  price: number
  description: string
  popular: boolean
  available?: boolean
  features: Feature[]
}

export type PlanId = 'basic' | 'collector' | 'enterprise'

export const planPrices: { [key: string]: number } = {
  basic: 0,
  collector: 9.99,
  enterprise: 69.69,
}

export const plans: Plan[] = [
  {
    id: 'basic',
    name: 'free',
    price: planPrices.basic ?? 0,
    description: 'greatTryingAne',
    popular: false,
    available: true,
    features: [
      { text: 'XActiveFilters', amount: 3, included: true },
      { text: 'pushNotifications', included: true },
      { text: 'XMinuteDelay', amount: 30, included: true },
      { text: 'XPremiumSearchesOnSignUp', amount: 100, included: true },
      { text: 'priceCalculation', included: false },
    ],
  },
  {
    id: 'collector',
    name: 'collector',
    price: planPrices.collector ?? 0,
    description: 'buyThingsCheaper',
    popular: true,
    available: true,
    features: [
      { text: 'XActiveFilters', amount: 20, included: true },
      { text: 'pushNotifications', included: true },
      { text: 'XMinuteDelay', amount: 10, included: true },
      { text: 'XincludedPremiumSearches', amount: 3500, included: true },
      { text: 'priceCalculation', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'flipper',
    price: planPrices.enterprise ?? 0,
    description: 'forBestOfBestFlippers',
    popular: false,
    available: false,
    features: [
      { text: 'XActiveFilters', amount: 500, included: true },
      { text: 'pushNotifications', included: true },
      { text: 'XMinuteDelay', amount: 1, included: true },
      { text: 'XincludedPremiumSearches', amount: 25000, included: true },
      { text: 'priceCalculation', included: true },
    ],

  },
]
