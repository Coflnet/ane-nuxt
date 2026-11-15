import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createPinia, defineStore } from 'pinia'
import { computed, ref } from 'vue'

const source = await readFile(new URL('../stores/user.ts', import.meta.url), 'utf8')
const code = stripTypeScriptTypes(source).replace(/^import .*$/gm, '').replace('export const useUserStore', 'const useUserStore')

function createStore(getSubscription) {
  const useStore = new Function('defineStore', 'ref', 'computed', 'useLocalePath', 'navigateTo', 'getSubscription', `${code}; return useUserStore`)(
    defineStore, ref, computed, () => path => path, () => {}, getSubscription,
  )
  const store = useStore(createPinia())
  store.token = 'account-a'
  store.currentPlan = { product: 'collector', createdAt: 'cached-date' }
  store.subscriptionStartDate = 'cached-date'
  store.noPremium = false
  return store
}

test('subscription refresh prioritizes active Flipper then Collector and rejects expired or invalid dates', async () => {
  const expired = { product: 'flipper', endsAt: '2000-01-01T00:00:00Z' }
  const invalid = { product: 'flipper', endsAt: 'not-a-date' }
  const collector = { product: 'collector', createdAt: '2026-01-01T00:00:00Z', endsAt: '' }
  const flipper = { product: 'flipper', createdAt: '2026-02-01T00:00:00Z', endsAt: '2999-01-01T00:00:00Z' }
  const basic = { product: 'basic', endsAt: null }
  let subscriptions = [basic, expired, invalid, collector, flipper]
  const store = createStore(async options => {
    assert.equal(options.headers.Authorization, 'Bearer account-a')
    assert.ok(options.signal instanceof AbortSignal)
    return subscriptions
  })
  await store.getSubscriptionEndDate()
  assert.deepEqual(store.currentPlan, flipper)
  assert.equal(store.subscriptionStartDate, flipper.createdAt)
  assert.equal(store.noPremium, false)
  subscriptions = [basic, expired, invalid, collector]
  await store.getSubscriptionEndDate()
  assert.deepEqual(store.currentPlan, collector)
  subscriptions = [expired, invalid, basic]
  await store.getSubscriptionEndDate()
  assert.deepEqual(store.currentPlan, basic)
  subscriptions = [expired, invalid]
  await store.getSubscriptionEndDate()
  assert.equal(store.currentPlan, null)
  assert.equal(store.subscriptionStartDate, '')
  assert.equal(store.noPremium, true)
})

test('subscription refresh without a token clears cached entitlement without a request', async () => {
  const store = createStore(() => assert.fail('signed-out users must not make a subscription request'))
  store.token = null
  await store.getSubscriptionEndDate()
  assert.equal(store.currentPlan, null)
  assert.equal(store.subscriptionStartDate, '')
  assert.equal(store.noPremium, null)
})

test('failed refresh clears cached entitlement and rejects so a retry can recover', async () => {
  let fail = true
  const store = createStore(async () => {
    if (fail) throw new Error('offline')
    return [{ product: 'collector' }]
  })
  await assert.rejects(store.getSubscriptionEndDate(), /offline/)
  assert.equal(store.currentPlan, null)
  assert.equal(store.subscriptionStartDate, '')
  assert.equal(store.noPremium, null)
  fail = false
  await store.getSubscriptionEndDate()
  assert.equal(store.currentPlan.product, 'collector')
})

test('late response for a previous account cannot overwrite the current account entitlement', async () => {
  let resolveOld
  const store = createStore(({ headers }) => headers.Authorization === 'Bearer account-a'
    ? new Promise(resolve => resolveOld = resolve)
    : Promise.resolve([{ product: 'basic', createdAt: 'new-account-date' }]))
  const previous = store.getSubscriptionEndDate()
  assert.equal(store.currentPlan, null, 'cached rights are cleared while checking')
  store.token = 'account-b'
  await store.getSubscriptionEndDate()
  resolveOld([{ product: 'flipper', createdAt: 'old-account-date' }])
  await previous
  assert.equal(store.currentPlan.product, 'basic')
  assert.equal(store.subscriptionStartDate, 'new-account-date')
})

test('logout clears subscription state and an outstanding lookup cannot restore it', async () => {
  let resolve
  const store = createStore(() => new Promise(done => resolve = done))
  const pending = store.getSubscriptionEndDate()
  await store.logout()
  resolve([{ product: 'flipper' }])
  await pending
  assert.equal(store.currentPlan, null)
  assert.equal(store.subscriptionStartDate, '')
  assert.equal(store.noPremium, null)
})
