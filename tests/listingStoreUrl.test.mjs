import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createPinia, defineStore } from 'pinia'
import { ref } from 'vue'
import { getPlatformUrl } from '../utils/flipMarketplaceUrl.ts'

const source = await readFile(new URL('../stores/listing.ts', import.meta.url), 'utf8')
const code = stripTypeScriptTypes(source).replace(/^import .*$/gm, '').replace('export const useListingStore', 'const useListingStore')

function createStore() {
  const useStore = new Function('defineStore', 'ref', 'useUserStore', 'getMatches', `${code}; return useListingStore`)(
    defineStore, ref, () => ({ token: null }), async () => [],
  )
  return useStore(createPinia())
}

test('Shpock links always use the de-de path, whatever the UI language is', () => {
  const store = createStore()
  for (const lang of ['en', 'de', 'fr-FR', 'es-ES']) {
    const url = store.constructListingUrl({ platform: 'Shpock', id: 'abc123' }, lang)
    assert.equal(url, 'https://www.shpock.com/de-de/i/abc123')
    assert.equal(url, getPlatformUrl('Shpock', 'abc123'))
  }
})
