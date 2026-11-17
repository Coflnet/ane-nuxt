import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { effectScope, nextTick, ref } from 'vue'
import { useMatchingOffers } from '../composables/useMatchingOffers.ts'
import { useStyleFeedback } from '../composables/useStyleFeedback.ts'

const source = await readFile(new URL('../pages/filters/create.vue', import.meta.url), 'utf8')
const serialize = stripTypeScriptTypes(source.slice(source.indexOf('async function filterToCreate('), source.indexOf('\nasync function handleFilters(')))

function serializer(notificationType) {
  const filter = { value: { id: 3, searchValue: '', notificationType, notificationTarget: 'private-notification-secret' } }
  const userStore = { notificationSettings: { discord: { webhookUrl: 'unchanged' }, email: { address: 'unchanged' } } }
  let pushConnections = 0
  const visual = JSON.stringify({ mode: 'style', garmentType: 'jacket', emb: [1, 0], threshold: 0.8 })
  const create = new Function('filter', 'toRaw', 'connectPushNotifications', 'userStore', 'styleMode', 't', 'handleFilters', `${serialize}; return filterToCreate`)(
    filter, value => value, async () => {
      pushConnections++
      return 'push-secret'
    }, userStore, { value: true }, key => key,
    async () => [{ name: 'VisualSimilarityFilter', value: visual }, { name: 'SearchTerm', value: '' }],
  )
  return { create, filter, userStore, get pushConnections() {
    return pushConnections
  } }
}

for (const target of ['FireBase', 'DiscordWebhook', 'Email']) {
  test(`style preview excludes ${target} secrets and causes no notification side effects`, async () => {
    const fixture = serializer(target)
    const request = await fixture.create(true)
    assert.equal(request.target, '')
    assert.equal(request.targetType, 'Unknown')
    assert.equal(fixture.pushConnections, 0)
    assert.equal(fixture.filter.value.notificationTarget, 'private-notification-secret')
    assert.deepEqual(fixture.userStore.notificationSettings, { discord: { webhookUrl: 'unchanged' }, email: { address: 'unchanged' } })
    assert.equal(JSON.stringify(request).includes('secret'), false)
    assert.equal(JSON.parse(request.filters[0].value).mode, 'style')
    assert.equal(request.filters[1].value, '', 'image-only preview needs no keyword')
  })
}

test('save still connects push notifications when explicitly saving', async () => {
  const fixture = serializer('FireBase')
  const request = await fixture.create()
  assert.equal(fixture.pushConnections, 1)
  assert.equal(request.target, 'push-secret')
  assert.equal(request.targetType, 'FireBase')
})

test('save handler refuses unfinished image work before serialization or persistence', async () => {
  const body = stripTypeScriptTypes(source.slice(source.indexOf('async function saveFilter()'), source.indexOf('\nasync function filterToCreate(')))
  let calls = 0
  const save = new Function('visualReady', 'feedback', 'savingFilter', 'filterToCreate', `${body}; return saveFilter`)(
    { value: false }, { pending: { value: false } }, { value: false }, () => {
      calls++
      throw new Error('must not serialize')
    },
  )
  await save()
  assert.equal(calls, 0)
})

function preview() {
  const requests = []
  const scope = effectScope()
  const offers = scope.run(() => useMatchingOffers({
    buildRequest: async () => ({ filters: [] }),
    test: (_, signal) => new Promise((resolve, reject) => requests.push({ resolve, reject, signal })),
    signature: () => '',
    enabled: () => true,
    delay: () => 0,
  }))
  offers.offers.value = [{ id: 'previous' }]
  return { offers, requests, run: offers.run, stop: () => scope.stop() }
}

const settle = () => new Promise(resolve => setImmediate(resolve))

test('a late obsolete style preview cannot replace newer matches', async () => {
  const field = preview()
  const first = field.run()
  await settle()
  const second = field.run()
  await settle()
  assert.equal(field.requests[0].signal.aborted, true)
  field.requests[1].resolve([{ id: 'newer', foundAt: 'today' }])
  await second
  field.requests[0].resolve([{ id: 'obsolete' }])
  await first
  assert.equal(field.offers.offers.value[0].id, 'newer')
  assert.equal(field.offers.loading.value, false)
  field.stop()
})

test('failed style preview preserves previous matches and exposes retry state', async () => {
  const field = preview()
  const attempt = field.run()
  await settle()
  field.requests[0].reject(new Error('Temporary outage'))
  await attempt
  assert.deepEqual(field.offers.offers.value, [{ id: 'previous' }])
  assert.equal(field.offers.error.value, true)
  assert.equal(field.offers.loading.value, false)
  const retry = field.run()
  await settle()
  field.requests[1].resolve([])
  await retry
  assert.deepEqual(field.offers.offers.value, [])
  assert.equal(field.offers.error.value, false)
  assert.equal(field.offers.done.value, true)
  field.stop()
})

test('matching offers debounce signature changes, abort the in-flight call and skip without input', async () => {
  const requests = []
  const signature = ref('a')
  const unrelated = ref(0)
  const enabled = ref(true)
  const scope = effectScope()
  scope.run(() => useMatchingOffers({
    buildRequest: async () => ({ filters: [] }),
    test: (_, signal) => new Promise(resolve => requests.push({ resolve, signal })),
    signature: () => `${unrelated.value * 0}${signature.value}`,
    enabled: () => enabled.value,
    delay: () => 5,
  }))
  signature.value = 'b'
  await nextTick()
  signature.value = 'c'
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(requests.length, 1, 'quick edits collapse into one preview call')
  unrelated.value++
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(requests.length, 1, 'edits that keep the signature (e.g. notification settings) do not refetch')
  assert.equal(requests[0].signal.aborted, false)
  signature.value = 'd'
  await nextTick()
  assert.equal(requests[0].signal.aborted, true, 'a newer signature aborts the in-flight call')
  enabled.value = false
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(requests.length, 1, 'no call without a search term or style photo')
  scope.stop()
})

function feedback(examples = []) {
  const initial = JSON.stringify({ mode: 'style', garmentType: 'jacket', emb: [1, 0], examples })
  const visual = ref(initial)
  const requests = []
  const scope = effectScope()
  const actions = scope.run(() => useStyleFeedback({
    visual, saving: ref(false), ready: ref(true), apiBase: 'https://api.example.test', token: () => 'auth-token',
    fetcher: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
  }))
  return { visual, requests, ...actions }
}

const listing = { id: 'sample-listing', platform: 'Ebay', imageUrls: ['https://example.invalid/photo'], title: 'Jacket' }
const proof = { model_id: 'synthetic/model', model_revision: 'revision' }

test('explicit style feedback posts listing identity without URLs or notification secrets and preserves polarity', async () => {
  const field = feedback()
  const attempt = field.addFeedback(listing, false)
  assert.deepEqual(field.requests[0].options.body, { listingId: listing.id, platform: listing.platform, photoIndex: 0 })
  assert.equal(field.requests[0].url, 'https://api.example.test/api/filters/visual-similarity/example', 'uses the configured API base')
  assert.equal(JSON.stringify(field.requests[0].options).includes('secret'), false)
  field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg' })
  await attempt
  assert.deepEqual(JSON.parse(field.visual.value).examples, [{ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg', positive: false }])
  field.clearFeedback()
  assert.equal(JSON.parse(field.visual.value).examples, undefined)
})

test('style preferences are bounded and a changed reference ignores late feedback', async () => {
  const full = feedback(Array.from({ length: 4 }, () => ({ emb: [1, 0], provenance: proof, positive: true })))
  await full.addFeedback(listing, true)
  assert.equal(full.requests.length, 0)
  const field = feedback()
  const attempt = field.addFeedback(listing, true)
  field.visual.value = 'new reference'
  field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg' })
  await attempt
  assert.equal(field.visual.value, 'new reference')
})

test('feedback failure preserves serialized input and permits retry', async () => {
  const field = feedback()
  const before = field.visual.value
  const attempt = field.addFeedback(listing, true)
  field.requests[0].reject(new Error('Temporary failure'))
  await attempt
  assert.equal(field.visual.value, before)
  assert.equal(field.failure.value.positive, true)
  const retry = field.addFeedback(field.failure.value.listing, field.failure.value.positive)
  field.requests[1].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg' })
  await retry
  assert.equal(JSON.parse(field.visual.value).examples[0].positive, true)
  assert.equal(field.failure.value, null)
})

test('switching the photo lane asks before discarding an image and preserves it when cancelled', () => {
  const body = stripTypeScriptTypes(source.slice(source.indexOf('function setPhotoLane('), source.indexOf('\nfunction choosePhotoLane(')))
  const filter = { value: { visualSimilarity: 'saved image and preferences' } }
  const photoLane = { value: 'style' }
  const visualReady = { value: true }
  let accepted = false
  const switchLane = new Function('filter', 'photoLane', 'visualReady', 'referenceDirty', 'savingFilter', 'window', 't', `${body}; return setPhotoLane`)(
    filter, photoLane, visualReady, { value: false }, { value: false }, { confirm: () => accepted }, key => key,
  )
  switchLane('other')
  assert.equal(photoLane.value, 'style')
  assert.equal(filter.value.visualSimilarity, 'saved image and preferences')
  accepted = true
  switchLane('other')
  assert.equal(photoLane.value, 'other')
  assert.equal(filter.value.visualSimilarity, '')
  assert.equal(visualReady.value, true)
  switchLane('style')
  assert.equal(visualReady.value, false, 'the style lane waits for its photo and garment type')
})

test('feedback without matching source proof cannot be saved into the reference', async () => {
  for (const source of [{}, { sourceListingId: 'other-listing', sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg' }, { sourceListingId: listing.id, sourcePlatform: 'Other' }]) {
    const field = feedback()
    const before = field.visual.value
    const attempt = field.addFeedback(listing, true)
    field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceImageUrl: 'https://images.example.test/garment.jpg', ...source })
    await attempt
    assert.equal(field.visual.value, before)
    assert.equal(field.failure.value.listing.id, listing.id)
  }
})

test('feedback rejects insecure, credential-bearing, invalid and oversized source image URLs', async () => {
  for (const sourceImageUrl of ['http://images.example.test/a.jpg', 'https://user:secret@images.example.test/a.jpg', 'not-a-url', `https://images.example.test/${'x'.repeat(2048)}`]) {
    const field = feedback()
    const before = field.visual.value
    const attempt = field.addFeedback(listing, true)
    field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl })
    await attempt
    assert.equal(field.visual.value, before)
    assert.equal(field.failure.value.listing.id, listing.id)
  }
})

test('programmatic edits during saving stay in the form and retain the saved id for the next save', async () => {
  const body = stripTypeScriptTypes(source.slice(source.indexOf('async function saveFilter()'), source.indexOf('\nasync function filterToCreate(')))
  const filter = { value: { id: 0, searchValue: 'before' } }
  let finish
  const messages = []
  let navigation = 0
  const state = { visualReady: { value: true }, feedback: { pending: { value: false } }, savingFilter: { value: false }, filter, referenceDirty: { value: true } }
  const save = new Function(...Object.keys(state), 'filterToCreate', 'filterStore', 'push', 't', 'navigateTo', 'localePath', `let savedSnapshot; ${body}; return saveFilter`)(
    ...Object.values(state), async () => ({ filters: [] }), { saveFilter: () => new Promise((resolve) => { finish = resolve }) },
    { error: message => messages.push(message), success: message => messages.push(message) }, key => key, async () => { navigation++ }, value => value,
  )
  const pending = save()
  await settle()
  assert.equal(state.savingFilter.value, true)
  filter.value.searchValue = 'newer unsaved edit'
  finish({ id: 42 })
  await pending
  assert.equal(navigation, 0)
  assert.equal(filter.value.searchValue, 'newer unsaved edit')
  assert.equal(filter.value.id, 42)
  assert.equal(state.referenceDirty.value, true)
  assert.deepEqual(messages, ['styleSearch.savedEarlierVersion'])
  assert.equal(state.savingFilter.value, false)
})

test('changing a listing preference replaces its vector and polarity even when four references exist', async () => {
  for (const count of [1, 4]) {
    const examples = Array.from({ length: count }, (_, index) => ({ emb: [1, 0], provenance: proof, sourceListingId: index === 0 ? listing.id : `other-${index}`, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/old.jpg', positive: false }))
    const field = feedback(examples)
    const attempt = field.addFeedback(listing, true)
    assert.equal(field.requests.length, 1)
    field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/new.jpg' })
    await attempt
    const updated = JSON.parse(field.visual.value).examples
    assert.equal(updated.length, count)
    assert.equal(updated[0].positive, true)
    assert.deepEqual(updated[0].emb, [0, 1])
    assert.equal(updated[0].sourceImageUrl, 'https://images.example.test/new.jpg')
    assert.deepEqual(updated.slice(1), examples.slice(1))
  }
})

test('explicitly saving with notifications off preserves the existing None choice', async () => {
  const fixture = serializer('Unknown')
  const request = await fixture.create()
  assert.equal(request.targetType, 'Unknown')
  assert.equal(fixture.pushConnections, 0)
  assert.deepEqual(fixture.userStore.notificationSettings, { discord: { webhookUrl: 'unchanged' }, email: { address: 'unchanged' } })
})

test('with a max the extra uncapped request fills aboveMax; its failure never breaks the main result', async () => {
  const calls = []
  const scope = effectScope()
  const capped = { filters: [{ name: 'PriceRange', value: '0-270' }] }
  const field = scope.run(() => useMatchingOffers({
    buildRequest: async () => capped,
    includeAboveMax: true,
    test: async (l) => {
      calls.push(l)
      if (l.filters[0].value !== '0-270') throw new Error('boom')
      return [{ id: 'a', platform: 'E', price: 100 }]
    },
    signature: () => '',
    enabled: () => true,
    delay: () => 0,
  }))
  await field.run()
  await settle()
  assert.equal(calls.length, 2)
  assert.equal(field.error.value, false)
  assert.equal(field.offers.value.length, 1)
  assert.deepEqual(field.aboveMax.value, [])
  scope.stop()
})

test('the within-cap result is published before the uncapped request finishes', async () => {
  const pending = []
  const scope = effectScope()
  const field = scope.run(() => useMatchingOffers({
    buildRequest: async () => ({ filters: [{ name: 'PriceRange', value: '0-270' }] }),
    test: l => new Promise(resolve => pending.push({ l, resolve })),
    includeAboveMax: true,
    signature: () => '',
    enabled: () => true,
    delay: () => 0,
  }))
  const running = field.run()
  await settle()
  const main = pending.find(p => p.l.filters[0].value === '0-270')
  const extra = pending.find(p => p.l.filters[0].value !== '0-270')
  main.resolve([{ id: 'a', platform: 'E', price: 100 }])
  await running
  assert.equal(field.done.value, true)
  assert.equal(field.loading.value, false)
  assert.deepEqual(field.aboveMax.value, [])
  extra.resolve([{ id: 'a', platform: 'E', price: 100 }, { id: 'b', platform: 'E', price: 300 }])
  await settle()
  assert.deepEqual(field.aboveMax.value.map(o => o.id), ['b'])
  scope.stop()
})
