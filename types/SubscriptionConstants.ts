export interface Feature {
  text: string;
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

export type PlanId = 'basic' | 'pro' | 'enterprise';

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
      { text: '3activeFilters', included: true },
      { text: 'pushNotifications', included: true },
      { text: '30MinuteDelay', included: true },
      { text: 'priceCalculation', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'pro',
    price: planPrices.pro ?? 0,
    description: 'buyThingsCheaper',
    popular: true,
    features: [
      { text: '20ActiveFilters', included: true },
      { text: 'pushNotifications', included: true },
      { text: '10MinuteDelay', included: true },
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
      { text: '500activeFilters', included: true },
      { text: 'pushNotifications', included: true },
      { text: '2MinuteDelay', included: true },
      { text: 'priceCalculation', included: true },
    ],

  },
];

