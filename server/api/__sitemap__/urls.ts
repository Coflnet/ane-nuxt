// server/api/__sitemap__/urls.ts
import { defineSitemapEventHandler } from '#imports'
import type { SitemapUrlInput } from '#sitemap/types'

const hostName = 'https://your-domain.com' // **Replace with your actual domain**

export default defineSitemapEventHandler(() => {
  return [
    {
      loc: '/marketplaces/ebay', // This is the base path
      _i18nTransform: true, // Automatically generates URLs for all configured locales
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
    // Add any other dynamic or static pages that you want _i18nTransform to handle
    // For example, if your homepage is also translated:
    // {
    //   loc: '/',
    //   _i18nTransform: true,
    //   lastmod: new Date(),
    //   changefreq: 'hourly',
    //   priority: 1.0,
    // },
  ] satisfies SitemapUrlInput[]
})
