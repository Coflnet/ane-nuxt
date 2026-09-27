import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// nuxt.config.ts relies on Nuxt's own config loader for the ambient `defineNuxtConfig` global,
// so it can't be imported directly in plain Node; assert on its source text instead, matching
// the pattern already used by node-version.test.mjs for other config files.

// Regression: `alwaysRedirect: true` + `redirectOn: 'all'` sent a browser with an English
// Accept-Language header from an explicitly requested `/de/...` URL straight back to `/...`,
// so an explicit locale prefix in the URL was never respected.
test('browser-language detection only auto-redirects on the first visit to `/`', async () => {
  const config = await readFile(new URL('../nuxt.config.ts', import.meta.url), 'utf8')
  const detectBlockMatch = config.match(/detectBrowserLanguage:\s*\{([^}]*)\}/)

  assert.ok(detectBlockMatch, 'detectBrowserLanguage block not found in nuxt.config.ts')
  const detectBlock = detectBlockMatch[1]

  assert.match(detectBlock, /alwaysRedirect:\s*false/)
  assert.match(detectBlock, /redirectOn:\s*'root'/)
})

// Regression: no locale declared a `language` ISO tag, so useLocaleHead()'s `currentLanguage`
// was always undefined and `<html lang>` (and the hreflang alternate links) were omitted from
// every SSR response.
test('every locale declares a language tag so <html lang> can be set', async () => {
  const config = await readFile(new URL('../nuxt.config.ts', import.meta.url), 'utf8')
  const localesBlockMatch = config.match(/locales:\s*\[([^\]]*)\]/)

  assert.ok(localesBlockMatch, 'locales array not found in nuxt.config.ts')
  const localeEntries = [...localesBlockMatch[1].matchAll(/\{([^}]*)\}/g)].map(m => m[1])

  assert.ok(localeEntries.length >= 2)
  for (const entry of localeEntries)
    assert.match(entry, /language:\s*'[a-z]{2}-[A-Z]{2}'/, `locale entry missing a language tag: ${entry}`)
})
