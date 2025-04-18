interface TopFilter {
  name: string;
  matches: number;
  keywords: string[];
}

interface FilterFace {
  id: number;
  name: string;
  marketplace: string;
  keywords: string[];
  priceRange: string;
  location: string;
  active: boolean;
  matchCount: number;
}


