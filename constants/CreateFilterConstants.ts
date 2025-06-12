export const marketplaces = [
  { value: 'all', label: 'allMarket' },
  { value: 'Ebay', label: 'Ebay' },
  { value: 'Kleinanzeigen', label: 'Kleinanzeigen' },
  { value: 'AutoScout24', label: 'autoScout' },
  { value: 'Facebook', label: 'facebookMarketplace', premium: true },
  { value: 'Craigslist', label: 'craigslistMarketplace' },
]
export const frequency = [
  { value: '*/20 * * * *', label: 'frequency20Minutes' },
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
