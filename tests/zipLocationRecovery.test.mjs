import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const root = new URL('../', import.meta.url)
const search = await readFile(process.env.ZIP_SEARCH_SOURCE || new URL('pages/search.vue', root), 'utf8')
const flipper = await readFile(process.env.ZIP_FLIPPER_SOURCE || new URL('pages/flipper.vue', root), 'utf8')
const fn = (source, name) => source.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n}`))[0]
const ref = value => ({ value })
for (const outcome of ['success', 'failure']) test(`a pending search ZIP ${outcome} cannot restore or error after a cleared distance filter`, async () => {
  let resolve, reject
  const pushed = []
  const state = {
    zipCodeInput: ref('10115'), zipLoading: ref(false), zipError: ref(''), locationName: ref(''),
    userLocation: ref(null), zipResolving: ref(true), selectedCountryCode: ref(''), distanceFilterKm: ref(25),
    route: { query: { q: 'synthetic', zip: '10115', max_distance: '25' } },
    getLocation: () => new Promise((res, rej) => {
      resolve = res
      reject = rej
    }), nextTick: async () => {}, performSearch() {},
    router: { push({ query }) {
      state.route.query = query
      pushed.push(query)
    } }, console: { error() {} },
  }
  const actions = new Function('state', `with(state){${stripTypeScriptTypes(fn(search, 'lookupZipCode') + '\n' + fn(search, 'clearDistanceFilter'))}; return {lookupZipCode,clearDistanceFilter}}`)(state)
  const request = actions.lookupZipCode()
  actions.clearDistanceFilter()
  if (outcome === 'success') resolve({ lat: 52.5, lon: 13.4, name: 'Synthetic location' })
  else reject(new Error('synthetic location outage'))
  await request
  assert.equal(pushed.at(-1).zip, undefined)
  assert.equal(state.userLocation.value, null)
  assert.equal(state.zipError.value, '')
  assert.equal(state.zipLoading.value, false)
  assert.equal(state.zipResolving.value, false)
})
for (const outcome of ['success', 'failure']) test(`an older flipper ZIP ${outcome} cannot replace or error the latest requested location`, async () => {
  const pending = []
  const state = {
    locationZip: ref('10115'), locationError: ref(''), userLocation: ref(null), locationLabel: ref(''), sortMode: ref('newest'),
    $fetch: () => new Promise((resolve, reject) => pending.push({ resolve, reject })), useI18n: () => ({ t: key => key }),
  }
  const run = new Function('state', `with(state){${stripTypeScriptTypes(fn(flipper, 'geocodeZip'))}; return geocodeZip}`)(state)
  const older = run()
  state.locationZip.value = '20095'
  const newer = run()
  pending[1].resolve([{ lat: '53.5', lon: '10', display_name: 'New location' }])
  await newer
  assert.deepEqual(state.userLocation.value, { lat: 53.5, lng: 10 })
  if (outcome === 'success') pending[0].resolve([{ lat: '52.5', lon: '13.4', display_name: 'Old location' }])
  else pending[0].reject(new Error('synthetic stale outage'))
  await older
  assert.deepEqual(state.userLocation.value, { lat: 53.5, lng: 10 })
  assert.equal(state.locationError.value, '')
})
