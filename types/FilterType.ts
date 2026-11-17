export type TargetType = 'Unknown' | 'FireBase' | 'DiscordWebhook' | 'Email' | 'WhatsApp'

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
  /** paused because the user had no website activity for 30 days */
  pausedForInactivity: boolean
  disabledByError: boolean
  matchCount: number
  isFlipNotification?: boolean
}

/** One entry of a saved filter's `filters[]` as it travels over the wire. */
export interface WireFilter {
  name: string
  value: string | number | boolean
}

/** The create/edit form state; utils/filterWire.ts converts it to and from WireFilter[]. */
export interface Filter {
  name: string
  marketplace: string
  searchValue: string
  zipcode: string
  searchRadius: number | null
  seller: string
  keywords: string[][]
  blacklist: string[]
  /** '' = no lower bound ("any price") */
  minPrice: number | ''
  /** '' = no upper bound ("any price") */
  maxPrice: number | ''
  /** Attribute chips per key (utils/attributeAlternatives.ts). */
  attributes: Record<string, string[]>
  kleinanzeigenCategory: string
  /** Saved filters[] entries the form does not model; saved back unchanged. */
  passthrough: WireFilter[]
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
  /** Serialized JSON payload for VisualSimilarityFilter ('' = disabled). */
  visualSimilarity: string
  referenceUrl: string
  referenceTitle: string
  referenceMarketplace: string
  referencePrice: number
  referenceCurrency: string
  referenceSelector: string
  referenceAdditionalSelectors?: string[]
  referenceLastRefreshedAt: string
}
