type TargetType = 'Unknown' | 'FireBase' | 'DiscordWebhook' | 'Email' | 'WhatsApp'

export interface TopFilter {
  name: string
  matches: number
  id: string
  keywords: string[]
}

export interface FilterFace {
  id: number
  name: string
  marketplace: string
  keywords: string[]
  priceRange: string
  location: string
  active: boolean
  matchCount: number
}

export interface Filter {
  name: string
  marketplace: string
  searchValue: string
  totalCost: number
  zipcode: string
  searchRadius: number | null
  commercialSeller: boolean
  seller: string
  keywords: string[][]
  blacklist: string[]
  minPrice: number
  maxPrice: number
  currency: string
  location: string
  id: number
  notificationType: TargetType
  notificationTarget: string
  country: string
  condition: string
  deliveryMethod: string
  frequency: string
  fuzzyness: string
}
