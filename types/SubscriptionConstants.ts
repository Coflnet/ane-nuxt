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
    name: 'Free',
    price: planPrices.basic ?? 0,
    description: 'Great for trying out ANE',
    popular: false,
    features: [
      { text: '3 Active Filters', included: true },
      { text: 'Email, Discord & push notifications', included: true },
      { text: '30 minute delay', included: true },
      { text: 'Price Calculation', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: planPrices.pro ?? 0,
    description: 'Great for buy things you want for cheaper',
    popular: true,
    features: [
      { text: '20 Active Filters', included: true },
      { text: 'Email, Discord & push notifications', included: true },
      { text: 'Within 10 minute delay', included: true },
      { text: 'Price Calculation', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Flipper',
    price: planPrices.enterprise ?? 0,
    description: 'For the best of the best flippers',
    popular: false,
    available: false,
    features: [
      { text: '500 Active Filters', included: true },
      { text: 'Email, Discord & push notifications', included: true },
      { text: '1-2 minute delay', included: true },
      { text: 'Price Calculation', included: true },
    ],

  },
];

