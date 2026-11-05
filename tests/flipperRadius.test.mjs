import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import * as Vue from 'vue'
import { renderToString } from 'vue/server-renderer'

const source = await readFile(process.env.FLIPPER_SOURCE || new URL('../pages/flipper.vue', import.meta.url), 'utf8')
const start = source.lastIndexOf('<div', source.indexOf('v-if="sortMode ==='))
const end = source.indexOf('</div>', source.indexOf('</div>', start) + 6) + 6
const render = Vue.compile(source.slice(start, end))
const radiusHtml = (sortMode, maxDistance) => {
  const app = Vue.createSSRApp({
    setup: () => ({ sortMode, filters: { maxDistance }, isFlipperTier: true }),
    render,
  })
  app.config.globalProperties.$t = key => key
  return renderToString(app)
}

test('nearest sorting exposes a radius from the unlimited default and after clearing it', async () => {
  for (const radius of [0, 25, '']) {
    assert.match(await radiusHtml('distance', radius), /type="number"/)
  }
})

test('other sort modes leave the radius control hidden', async () => {
  assert.doesNotMatch(await radiusHtml('newest', 0), /type="number"/)
})
