import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

// Execute the page's actual setup with Nuxt's metadata sinks and route supplied locally.
// This exercises translation lookup without starting authentication or calling AneApi.
test('marketplace metadata resolves names in both locales, including AutoScout24', async () => {
  const source = await readFile(new URL('../pages/marketplaces/[id].vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const setup = new Function('useRoute', 'ref', 'useI18n', 'definePageMeta', 'useSeoMeta', 'useJsonLd', 'buildBreadcrumbJsonLd', stripTypeScriptTypes(script))

  for (const locale of ['en', 'de']) {
    const messages = JSON.parse(await readFile(new URL(`../locales/${locale}.json`, import.meta.url), 'utf8'))
    const translate = (key, values = {}) => {
      const message = messages[key] ?? key.split('.').reduce((value, part) => value?.[part], messages)
      assert.equal(typeof message, 'string', `Missing ${locale} translation: ${key}`)
      return message.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`)
    }
    for (const id of ['autoscout24', 'kleinanzeigen', 'craigslist']) {
      let metadata
      let breadcrumbs
      setup(
        () => ({ params: { id }, path: `${locale === 'de' ? '/de' : ''}/marketplaces/${id}` }),
        value => ({ value }),
        () => ({ t: translate }),
        () => {},
        (value) => { metadata = value },
        (factory) => { breadcrumbs = factory() },
        entries => entries,
      )
      const name = translate(`${id}.name`)
      for (const field of ['title', 'ogTitle', 'description', 'ogDescription']) {
        assert.ok(metadata[field]().includes(name), `${locale}/${id} ${field} should identify the marketplace`)
      }
      assert.equal(breadcrumbs.at(-1).name, name)
    }
  }
})
