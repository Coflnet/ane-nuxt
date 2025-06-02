export const marketplaces = [
  { value: 'all', label: 'allMarket' },
  { value: 'Ebay', label: 'Ebay', premium: true },
  { value: 'Kleinanzeigen', label: 'Kleinanzeigen' },
  { value: 'AutoScout24', label: 'autoScout' },
]

export const frequency = [
  { value: '*/10 * * * *', label: 'frequency10Minutes' },
  { value: '0 * * * *', label: 'frequency1Hour' },
  { value: '0 */6 * * *', label: 'frequency6Hour' },
  { value: '0 16 * * *', label: 'frequency1PerDay' },
]

export const condidtion = [
  { value: 'all', label: 'allCondition' },
  { value: 'New', label: 'newCondition' },
  { value: 'used', label: 'usedCondition' },
  { value: 'refurbished', label: 'refurbishedCondition' },
  { value: 'broken', label: 'forPartsCondition' }]

export const deliveryKind = [
  { value: 'all', label: 'allDelivery' },
  { value: 'shipping', label: 'shippingDelivery' },
  { value: 'pickup', label: 'pickupDelivery' },
]
