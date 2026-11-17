/** Response shapes of POST /api/reference-listings/preview (not in the generated client). */

export type ReferenceRenderedNode = {
  xpath: string
  css: string
  role: string
  text: string
  x: number
  y: number
  width: number
  height: number
  price?: number | null
  currency?: string | null
  confidence: number
}

export type ReferencePriceCandidate = {
  selector: string
  text: string
  price: number
  currency: string
  confidence: number
  source: string
  isAutoSelected: boolean
}

export type ReferenceListingPreviewResponse = {
  url: string
  host: string
  marketplace: string
  listing: {
    title: string
    description: string
    imageUrls: string[]
    productSearchQuery: string
  }
  priceCandidates: ReferencePriceCandidate[]
  previewElements: unknown[]
  selectedReference?: ReferencePriceCandidate | null
  requiresReferencePriceSelection: boolean
  suggestedFilter: {
    searchTerm: string
    marketplace: string
    minPrice: number
    maxPrice?: number | null
    referenceUrl: string
    referenceTitle: string
    referenceMarketplace: string
    referencePrice?: number | null
    referenceCurrency?: string | null
    referenceSelector?: string | null
  }
  screenshotPngBase64?: string | null
  viewportWidth: number
  viewportHeight: number
  fullPageHeight: number
  sandboxHtml?: string | null
  renderedNodes: ReferenceRenderedNode[]
  primarySelectorXPath?: string | null
}
