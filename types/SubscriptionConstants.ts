export interface Feature {
  text: string;
  amount?: number;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  popular: boolean;
  available?: boolean;
  features: Feature[];
}

export type PlanId = 'basic' | 'collector' | 'enterprise';

export const planPrices: { [key: string]: number } = {
  basic: 0,
  pro: 9.99,
  enterprise: 69.69,
};

export const plans: Plan[] = [
  {
    id: 'basic',
    name: 'free',
    price: planPrices.basic ?? 0,
    description: 'greatTryingAne',
    popular: false,
    features: [
      { text: 'XactiveFilters', amount: 3, included: true },
      { text: 'pushNotifications', included: true },
      { text: 'XMinuteDelay', amount: 30, included: true },
      { text: 'priceCalculation', included: false },
    ],
  },
  {
    id: 'collector',
    name: 'collector',
    price: planPrices.pro ?? 0,
    description: 'buyThingsCheaper',
    popular: true,
    features: [
      { text: 'XActiveFilters', amount: 20, included: true },
      { text: 'pushNotifications', included: true },
      { text: 'XMinuteDelay', amount: 10, included: true },
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
      { text: 'XactiveFilters', amount: 500, included: true },
      { text: 'pushNotifications', included: true },
      { text: 'XMinuteDelay', amount: 1, included: true },
      { text: 'priceCalculation', included: true },
    ],

  },
];

