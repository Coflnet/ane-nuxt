export interface Options {
  value: string
  label: string
  premium?: boolean
}

export const activeMarketplaces: Options[] = [
  { value: 'Ebay', label: 'eBay' },
  { value: 'Kleinanzeigen', label: 'Kleinanzeigen' },
  { value: 'Marktplaats', label: 'Marktplaats' },
  { value: 'Willhaben', label: 'Willhaben' },
  { value: 'Vinted', label: 'Vinted' },
  { value: 'Blocket', label: 'Blocket' },
  { value: 'ParuVendu', label: 'ParuVendu' },
  { value: 'OLX', label: 'OLX' },
  { value: 'Gumtree', label: 'Gumtree' },
]

export const marketplaces: Options[] = [
  { value: 'all', label: 'allMarket' },
  ...activeMarketplaces,
  { value: 'AutoScout24', label: 'autoScoutMarketplace' },
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
  { value: 'new', label: 'newCondition' },
  { value: 'used', label: 'usedCondition' },
  { value: 'broken', label: 'forPartsCondition' }]

export const deliveryKind = [
  { value: 'all', label: 'allDelivery' },
  { value: 'shipping', label: 'shippingDelivery' },
  { value: 'pickup', label: 'pickupDelivery' },
]

export const fuzzyOptions = [
  { value: '0', label: 'selectFuzzy' },
  { value: '1', label: 'singleLetterChanged' },
  { value: '2', label: 'lowFuzzy' },
  { value: '4', label: 'mediumFuzzy' },
]

export function filterFreeMarketplaces(inputMarketplaces: Options[]): Options[] {
  const cleanedMarketplaces = inputMarketplaces.filter(item => item.value !== 'all') // remove 'all' option if present
  return cleanedMarketplaces.filter(marketplace => !marketplace.premium)
}
