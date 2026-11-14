import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const source = await readFile(new URL('../pages/filters/create.vue', import.meta.url), 'utf8')
const serialize = stripTypeScriptTypes(source.slice(source.indexOf('async function filterToCreate('), source.indexOf('\nasync function handleFilters(')))

function serializer(notificationType) {
  const filter = { value: { id: 3, searchValue: '', notificationType, notificationTarget: 'private-notification-secret' } }
  const userStore = { notificationSettings: { discord: { webhookUrl: 'unchanged' }, email: { address: 'unchanged' } } }
  let pushConnections = 0
  const visual = JSON.stringify({ mode: 'style', garmentType: 'jacket', emb: [1, 0], threshold: 0.8 })
  const create = new Function('radiusError', 'filter', 'toRaw', 'connectPushNotifications', 'userStore', 'styleMode', 't', 'handleFilters', `${serialize}; return filterToCreate`)(
    { value: false }, filter, value => value, async () => {
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
  const save = new Function('visualReady', 'savingFilter', 'filterToCreate', `${body}; return saveFilter`)(
    { value: false }, { value: false }, () => {
      calls++
      throw new Error('must not serialize')
    },
  )
  await save()
  assert.equal(calls, 0)
})

function preview() {
  const body = stripTypeScriptTypes(source.slice(source.indexOf('async function testFilter()'), source.indexOf('\nfunction beforeUnload(')))
  const state = { visualReady: { value: true }, styleMode: { value: true }, filter: { value: { searchValue: '' } }, previewLoading: { value: false }, previewError: { value: false }, previewDone: { value: false }, matches: { value: [{ listenerId: 99 }] } }
  const requests = []
  const run = new Function(...Object.keys(state), 'filterToCreate', 'filterStore', `let previewRequest; ${body}; return testFilter`)(
    ...Object.values(state), async () => ({ filters: [] }),
    { testFilter: (_, signal) => new Promise((resolve, reject) => requests.push({ resolve, reject, signal })) },
  )
  return { state, requests, run }
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
  assert.equal(field.state.matches.value[0].listingData.id, 'newer')
  assert.equal(field.state.previewLoading.value, false)
})

test('failed style preview preserves previous matches and exposes retry state', async () => {
  const field = preview()
  const attempt = field.run()
  await settle()
  field.requests[0].reject(new Error('Temporary outage'))
  await attempt
  assert.deepEqual(field.state.matches.value, [{ listenerId: 99 }])
  assert.equal(field.state.previewError.value, true)
  assert.equal(field.state.previewLoading.value, false)
  const retry = field.run()
  await settle()
  field.requests[1].resolve([])
  await retry
  assert.deepEqual(field.state.matches.value, [])
  assert.equal(field.state.previewError.value, false)
  assert.equal(field.state.previewDone.value, true)
})

function feedback(examples = []) {
  const body = stripTypeScriptTypes(source.slice(source.indexOf('function clearFeedback()'), source.indexOf('\nwatch([filter, visualReady]')))
  const initial = JSON.stringify({ mode: 'style', garmentType: 'jacket', emb: [1, 0], examples })
  const state = { savingFilter: { value: false }, visualReady: { value: true }, feedbackPending: { value: false }, exampleCount: { value: examples.length }, filter: { value: { visualSimilarity: initial } }, feedbackError: { value: null }, userStore: { token: 'auth-token' } }
  const requests = []
  const actions = new Function(...Object.keys(state), 'feedbackChoice', '$fetch', `let feedbackRequest; ${body}; return { addFeedback, clearFeedback }`)(
    ...Object.values(state), listing => JSON.parse(state.filter.value.visualSimilarity).examples?.find(example => example.sourceListingId === listing.id && example.sourcePlatform === listing.platform)?.positive, (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
  )
  return { state, requests, ...actions }
}

const listing = { id: 'sample-listing', platform: 'Ebay', imageUrls: ['https://example.invalid/photo'], title: 'Jacket' }
const proof = { model_id: 'synthetic/model', model_revision: 'revision' }

test('explicit style feedback posts listing identity without URLs or notification secrets and preserves polarity', async () => {
  const field = feedback()
  const attempt = field.addFeedback(listing, false)
  assert.deepEqual(field.requests[0].options.body, { listingId: listing.id, platform: listing.platform, photoIndex: 0 })
  field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg' })
  await attempt
  assert.deepEqual(JSON.parse(field.state.filter.value.visualSimilarity).examples, [{ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg', positive: false }])
  field.clearFeedback()
  assert.equal(JSON.parse(field.state.filter.value.visualSimilarity).examples, undefined)
})

test('style preferences are bounded and a changed reference ignores late feedback', async () => {
  const full = feedback(Array.from({ length: 4 }, () => ({ emb: [1, 0], provenance: proof, positive: true })))
  await full.addFeedback(listing, true)
  assert.equal(full.requests.length, 0)
  const field = feedback()
  const attempt = field.addFeedback(listing, true)
  field.state.filter.value.visualSimilarity = 'new reference'
  field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg' })
  await attempt
  assert.equal(field.state.filter.value.visualSimilarity, 'new reference')
})

test('feedback failure preserves serialized input and permits retry', async () => {
  const field = feedback()
  const before = field.state.filter.value.visualSimilarity
  const attempt = field.addFeedback(listing, true)
  field.requests[0].reject(new Error('Temporary failure'))
  await attempt
  assert.equal(field.state.filter.value.visualSimilarity, before)
  assert.equal(field.state.feedbackError.value.positive, true)
  const retry = field.addFeedback(field.state.feedbackError.value.listing, field.state.feedbackError.value.positive)
  field.requests[1].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg' })
  await retry
  assert.equal(JSON.parse(field.state.filter.value.visualSimilarity).examples[0].positive, true)
  assert.equal(field.state.feedbackError.value, null)
})

test('switching search mode asks before discarding an image and preserves it when cancelled', () => {
  const body = stripTypeScriptTypes(source.slice(source.indexOf('function setStyleMode('), source.indexOf('\nconst filter = ref<Filter>')))
  const filter = { value: { visualSimilarity: 'saved image and preferences' } }
  const styleMode = { value: true }
  const visualReady = { value: true }
  let accepted = false
  const switchMode = new Function('filter', 'styleMode', 'visualReady', 'referenceDirty', 'savingFilter', 'window', 't', `${body}; return setStyleMode`)(
    filter, styleMode, visualReady, { value: false }, { value: false }, { confirm: () => accepted }, key => key,
  )
  switchMode(false)
  assert.equal(styleMode.value, true)
  assert.equal(filter.value.visualSimilarity, 'saved image and preferences')
  accepted = true
  switchMode(false)
  assert.equal(styleMode.value, false)
  assert.equal(filter.value.visualSimilarity, '')
})

test('feedback without matching source proof cannot be saved into the reference', async () => {
  for (const source of [{}, { sourceListingId: 'other-listing', sourcePlatform: listing.platform, sourceImageUrl: 'https://images.example.test/garment.jpg' }, { sourceListingId: listing.id, sourcePlatform: 'Other' }]) {
    const field = feedback()
    const before = field.state.filter.value.visualSimilarity
    const attempt = field.addFeedback(listing, true)
    field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceImageUrl: 'https://images.example.test/garment.jpg', ...source })
    await attempt
    assert.equal(field.state.filter.value.visualSimilarity, before)
    assert.equal(field.state.feedbackError.value.listing.id, listing.id)
  }
})

test('feedback rejects insecure, credential-bearing, invalid and oversized source image URLs', async () => {
  for (const sourceImageUrl of ['http://images.example.test/a.jpg', 'https://user:secret@images.example.test/a.jpg', 'not-a-url', `https://images.example.test/${'x'.repeat(2048)}`]) {
    const field = feedback()
    const before = field.state.filter.value.visualSimilarity
    const attempt = field.addFeedback(listing, true)
    field.requests[0].resolve({ emb: [0, 1], provenance: proof, sourceListingId: listing.id, sourcePlatform: listing.platform, sourceImageUrl })
    await attempt
    assert.equal(field.state.filter.value.visualSimilarity, before)
    assert.equal(field.state.feedbackError.value.listing.id, listing.id)
  }
})

test('programmatic edits during saving stay in the form and retain the saved id for the next save', async () => {
  const body = stripTypeScriptTypes(source.slice(source.indexOf('async function saveFilter()'), source.indexOf('\nasync function filterToCreate(')))
  const filter = { value: { id: 0, searchValue: 'before' } }
  let finish
  const messages = []
  let navigation = 0
  const state = { visualReady: { value: true }, feedbackPending: { value: false }, savingFilter: { value: false }, filter, referenceDirty: { value: true } }
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
    const updated = JSON.parse(field.state.filter.value.visualSimilarity).examples
    assert.equal(updated.length, count)
    assert.equal(updated[0].positive, true)
    assert.deepEqual(updated[0].emb, [0, 1])
    assert.equal(updated[0].sourceImageUrl, 'https://images.example.test/new.jpg')
    assert.deepEqual(updated.slice(1), examples.slice(1))
  }
})
