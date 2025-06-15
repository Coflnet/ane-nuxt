export interface Options {
  value: string
  label: string
  premium?: boolean
}

export const marketplaces: Options[] = [
  { value: 'all', label: 'allMarket' },
  { value: 'Ebay', label: 'Ebay' },
  { value: 'Kleinanzeigen', label: 'Kleinanzeigen' },
  { value: 'AutoScout24', label: 'autoScoutMarketplace' },
  { value: 'Facebook', label: 'facebookMarketplace', premium: true },
  { value: 'Marktplaats', label: 'Marktplaats' },
  { value: 'Willhaben', label: 'Willhaben' },
]

export const usMarketplaces: Options[] = [
  { value: 'all', label: 'allMarket' },
  { value: 'Ebay', label: 'Ebay' },
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

// Function to validate if the inputed marketplaces are the same as 'All Free Marketplaces' aka the default free marketplaces
export function valididateAllMarketplace(inputMarketplaces: Options[]): boolean {
  // return if the inputMarketplaces includes a premium marketplace
  const hasPremiumMarketplace = inputMarketplaces.some(marketplace => marketplace.premium === true)
  if (hasPremiumMarketplace) return false

  const allFreeMarketpllaces = filterFreeMarketplaces(inputMarketplaces)

  // check if the input is the same as the default free marketplaces
  return arraysHaveSameElements(allFreeMarketpllaces, inputMarketplaces)
}

function arraysHaveSameElements(arr1: Options[], arr2: Options[]): boolean {
  return arr1.length === arr2.length && arr1.every(element => arr2.includes(element))
}

// Validate if you are in na or eu for which marketplaces to display
export async function detectLocationNA(): Promise<boolean> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const continent = timeZone.split('/')[0]

  if (continent == 'America') {
    return true
  }
  return false
}

export function filterFreeMarketplaces(inputMarketplaces: Options[]): Options[] {
  const cleanedMarketplaces = inputMarketplaces.filter(item => item.value !== 'all') // remove 'all' option if present
  return cleanedMarketplaces.filter(marketplace => !marketplace.premium)
}

export function constructOptionsFromString(inputOptions: string): Options[] {
  const constructedArray: Options[] = []
  inputOptions.split(',').map((condidtionName: string) => {
    const item = marketplaces.find(m => m.value == condidtionName)
    if (item)
      constructedArray.push(item)
  })

  return constructedArray
}
