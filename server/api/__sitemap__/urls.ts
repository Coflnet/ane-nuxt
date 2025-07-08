// server/api/__sitemap__/urls.ts
import { defineSitemapEventHandler } from '#imports'
import type { SitemapUrlInput } from '#sitemap/types'

export default defineSitemapEventHandler(() => {
  return [
    {
      loc: '/marketplaces/ebay',
      _i18nTransform: true,
      lastmod: new Date(),
      changefreq: 'daily',
      priority: 0.8,
    },
    {
      loc: '/marketplaces/facebook',
      _i18nTransform: true,
      lastmod: new Date(),
      changefreq: 'daily',
      priority: 0.8,
    },
    {
      loc: '/marketplaces/craigslist',
      _i18nTransform: true,
      lastmod: new Date(),
      changefreq: 'daily',
      priority: 0.8,
    },
    {
      loc: '/marketplaces/kleinanzeigen',
      _i18nTransform: true,
      lastmod: new Date(),
      changefreq: 'daily',
      priority: 0.8,
    },
    {
      loc: '/marketplaces/autoscout24',
      _i18nTransform: true,
      lastmod: new Date(),
      changefreq: 'daily',
      priority: 0.8,
    },
  ] satisfies SitemapUrlInput[]
})
