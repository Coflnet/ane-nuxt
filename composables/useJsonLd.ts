import type { Product } from '~/src/api-client/types.gen'
import type { SeoArticle } from '~/utils/articles'

type JsonLdNode = Record<string, unknown>

// Canonical production host (matches `site.url` in nuxt.config). Used instead of
// the request origin so structured-data/canonical URLs are correct even when
// prerendered (where the request host is localhost), and so these helpers stay
// usable inside lazy head getters that run outside the Nuxt instance context.
const SITE_URL = 'https://ane.deals'

/** Resolve a path (or absolute URL) against the canonical site origin. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return new URL(path, SITE_URL).toString()
}

/** Inject one or more JSON-LD nodes as an `application/ld+json` script. */
export function useJsonLd(node: MaybeRefOrGetter<JsonLdNode | JsonLdNode[] | null>) {
  useHead({
    script: [{
      type: 'application/ld+json',
      // Escape characters that could prematurely close the <script> tag.
      innerHTML: () => {
        const value = toValue(node)
        if (!value) return ''
        return JSON.stringify(value)
          .replace(/</g, '\\u003c')
          .replace(/>/g, '\\u003e')
          .replace(/&/g, '\\u0026')
      },
    }],
  })
}

export function buildBreadcrumbJsonLd(items: { name: string, url: string }[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': item.name,
      'item': absoluteUrl(item.url),
    })),
  }
}

export function buildProductJsonLd(product: Product, canonical: string): JsonLdNode {
  const node: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name ?? undefined,
    'description': (product.description && product.description !== product.name)
      ? product.description
      : undefined,
    'image': product.imageUrl ?? undefined,
    'brand': product.brand ? { '@type': 'Brand', 'name': product.brand } : undefined,
    'category': product.category ?? product.categories?.[0] ?? undefined,
    'sku': product.id ?? undefined,
    'url': canonical,
  }

  const count = product.listingCount ?? 0
  const low = product.minPrice ?? product.avgPrice
  const high = product.maxPrice ?? product.avgPrice
  if (low != null && count > 0) {
    node.offers = {
      '@type': 'AggregateOffer',
      'priceCurrency': 'EUR',
      'lowPrice': low,
      'highPrice': high ?? low,
      'offerCount': count,
      'availability': 'https://schema.org/InStock',
    }
  }
  return node
}

export function buildArticleJsonLd(article: SeoArticle, canonical: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': article.title,
    'description': article.description,
    'image': absoluteUrl(article.heroImage),
    'datePublished': article.publishedAt,
    'dateModified': article.publishedAt,
    'inLanguage': article.locale,
    'articleSection': article.category,
    'mainEntityOfPage': { '@type': 'WebPage', '@id': canonical },
    'author': { '@type': 'Organization', 'name': 'Ane Deals' },
    'publisher': { '@type': 'Organization', 'name': 'Ane Deals' },
  }
}

export function buildBlogListJsonLd(articles: SeoArticle[], canonical: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'url': canonical,
    'name': 'Ane Deals Blog',
    'blogPost': articles.map(a => ({
      '@type': 'BlogPosting',
      'headline': a.title,
      'description': a.description,
      'datePublished': a.publishedAt,
      'url': absoluteUrl(`/blog/${a.slug}`),
    })),
  }
}
