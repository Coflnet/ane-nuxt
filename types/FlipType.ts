export interface FlipperItem {
  id: string
  name: string
  image: string
  currentPrice: number
  marketValue: number
  profit: number
  profitMargin: number
  marketplace: string
  condition: string
  category: string
  location: string
  sellerRating: number
  listedAt: Date
  isWatched: boolean
}
