// server/api/__sitemap__/urls.ts
import { defineSitemapEventHandler } from '#imports'
import type { SitemapUrlInput } from '#sitemap/types'
import { getPublishedArticles } from '~/utils/articles'

export default defineSitemapEventHandler(() => {
  const staticUrls: SitemapUrlInput[] = [
    {
      loc: '/marketplaces/craigslist',
      _i18nTransform: true,
    },
    {
      loc: '/marketplaces/kleinanzeigen',
      _i18nTransform: true,
    },
    {
      loc: '/marketplaces/autoscout24',
      _i18nTransform: true,
    },
    {
      loc: '/blog',
      _i18nTransform: true,
    },
  ]

  const articleUrls = getPublishedArticles().map(article => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.publishedAt,
    _i18nTransform: true,
  })) satisfies SitemapUrlInput[]

  return [...staticUrls, ...articleUrls] satisfies SitemapUrlInput[]
})
