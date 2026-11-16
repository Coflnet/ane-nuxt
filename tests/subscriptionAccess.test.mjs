import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createPinia, defineStore } from 'pinia'
import { compileScript, parse } from 'vue/compiler-sfc'
import * as vue from 'vue'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'
import { canLoadStats } from '../utils/stats.ts'
import { displayedPlan } from '../utils/displayedPlan.ts'

const source = await readFile(new URL('../stores/user.ts', import.meta.url), 'utf8')
const code = stripTypeScriptTypes(source).replace(/^import .*$/gm, '').replace('export const useUserStore', 'const useUserStore')

function createStore(getSubscription, getAccess = async () => ({ tier: 'free', until: null, source: null }), getStats = async () => assert.fail('unexpected stats request')) {
  const useStore = new Function('defineStore', 'ref', 'computed', 'useLocalePath', 'navigateTo', 'getSubscription', 'getAccess', 'getStats', 'canLoadStats', 'push', 'useI18n', `${code}; return useUserStore`)(
    defineStore, ref, computed, () => path => path, () => {}, getSubscription, getAccess, getStats, canLoadStats,
    { error: message => assert.fail(`unexpected error toast: ${message}`) }, () => ({ t: key => key }),
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
  const store = createStore(async (options) => {
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
  }, async () => {
    if (fail) throw new Error('access offline')
    return { tier: 'free' }
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

test('ownership-only grant gives the effective flipper tier without a subscription plan', async () => {
  const until = '2999-01-01T00:00:00Z'
  const store = createStore(async () => [], async (options) => {
    assert.equal(options.headers.Authorization, 'Bearer account-a')
    return { tier: 'flipper', until, source: 'ownership' }
  })
  await store.getSubscriptionEndDate()
  assert.equal(store.currentPlan, null)
  assert.equal(store.effectiveTier, 'flipper')
  assert.equal(store.noPremium, false)
  assert.equal(store.access.until, until)
})

test('effective tier takes the higher of subscription and access and ignores a failing access lookup', async () => {
  const collector = { product: 'collector', createdAt: '2026-01-01T00:00:00Z', endsAt: null }
  const store = createStore(async () => [collector], async () => ({ tier: 'flipper', source: 'ownership' }))
  await store.getSubscriptionEndDate()
  assert.equal(store.effectiveTier, 'flipper')

  const failing = createStore(async () => [collector], async () => {
    throw new Error('down')
  })
  await failing.getSubscriptionEndDate()
  assert.equal(failing.effectiveTier, 'collector')
  assert.equal(failing.access, null)
})

test('free users and the basic product stay free', async () => {
  const store = createStore(async () => [{ product: 'basic', endsAt: null }])
  await store.getSubscriptionEndDate()
  assert.equal(store.effectiveTier, 'free')
})

test('refreshEntitlements keeps the previous tier while loading and clears it without a token', async () => {
  let seen
  const store = createStore(async () => [], async () => ({ tier: 'collector', source: 'ownership' }))
  const pending = store.refreshEntitlements()
  seen = store.currentPlan
  await pending
  assert.equal(seen?.product, 'collector')
  assert.equal(store.effectiveTier, 'collector')
  store.token = null
  await store.refreshEntitlements()
  assert.equal(store.effectiveTier, 'free')
})

test('a failing subscription lookup does not throw when access loaded', async () => {
  const store = createStore(async () => {
    throw new Error('500')
  }, async () => ({ tier: 'flipper', until: '2999-01-01T00:00:00Z', source: 'ownership' }))
  await store.getSubscriptionEndDate()
  assert.equal(store.effectiveTier, 'flipper')
  assert.equal(store.currentPlan, null)
  await store.ensureEntitlements()
})

test('a failing access lookup is fine when the subscription loaded', async () => {
  const store = createStore(async () => [{ product: 'flipper' }], async () => {
    throw new Error('down')
  })
  await store.refreshEntitlements()
  assert.equal(store.effectiveTier, 'flipper')
})

test('both lookups failing reports the error and ensureEntitlements retries', async () => {
  let fail = true
  const store = createStore(async () => {
    if (fail) throw new Error('sub down')
    return []
  }, async () => {
    if (fail) throw new Error('access down')
    return { tier: 'flipper', source: 'ownership' }
  })
  await assert.rejects(store.ensureEntitlements(), /sub down/)
  fail = false
  await store.ensureEntitlements()
  assert.equal(store.effectiveTier, 'flipper')
})

test('concurrent refreshes share one request pair and ensureEntitlements skips once loaded', async () => {
  let subscriptionCalls = 0
  let accessCalls = 0
  const store = createStore(async () => {
    subscriptionCalls++
    return []
  }, async () => {
    accessCalls++
    return { tier: 'flipper', source: 'ownership' }
  })
  await Promise.all([store.refreshEntitlements(), store.ensureEntitlements(), store.ensureEntitlements()])
  assert.deepEqual([subscriptionCalls, accessCalls], [1, 1])
  await store.ensureEntitlements()
  assert.deepEqual([subscriptionCalls, accessCalls], [1, 1])
  await store.refreshEntitlements()
  assert.deepEqual([subscriptionCalls, accessCalls], [2, 2])
})

test('ensureEntitlements reloads after the token changes', async () => {
  let accessCalls = 0
  const store = createStore(async () => [], async () => {
    accessCalls++
    return { tier: 'free' }
  })
  await store.ensureEntitlements()
  store.token = 'account-b'
  await store.ensureEntitlements()
  assert.equal(accessCalls, 2)
})

test('fuzzy filter gate is reactive and loads entitlements on mount', async () => {
  const { descriptor } = parse(await readFile(new URL('../components/filters/fuzzyFilter.vue', import.meta.url), 'utf8'))
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'fuzzy-test' }).content)
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g, (_, names) => `const {${names.replace(/\bas\b/g, ':')}} = __vue`)
    .replace(/^import .*$/gm, '').replace('export default', 'return')
  const user = reactive({
    effectiveTier: 'free',
    token: 't',
    ensured: 0,
    ensureEntitlements() {
      user.ensured++
      return Promise.resolve()
    },
  })
  const scope = effectScope()
  let hasBasicPlan
  scope.run(() => {
    const setup = new Function('__vue', 'useUserStore', 'computed', 'watch', 'onMounted', 'fuzzyOptions', code)(
      { ...vue, useModel: () => ref({}) }, () => user, computed, watch, fn => fn(), [],
    )
    hasBasicPlan = setup.setup({}, { expose() {} }).hasBasicPlan
  })
  assert.equal(user.ensured, 1)
  assert.equal(hasBasicPlan.value, true)
  user.effectiveTier = 'flipper'
  assert.equal(hasBasicPlan.value, false)
  user.token = 'u'
  await nextTick()
  assert.equal(user.ensured, 2)
  scope.stop()
})

test('consumers of the plan use the effective tier instead of the subscription product', async () => {
  for (const file of ['components/filters/VisualSimilarityFilter.vue', 'components/filters/fuzzyFilter.vue', 'components/filters/SearchValueMarketplaceFilter.vue']) {
    const text = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
    assert.match(text, /effectiveTier/, file)
    assert.doesNotMatch(text, /currentPlan\?\.product/, file)
  }
})

test('subscriptions page shows the store selection and grant instead of the raw first subscription record', async () => {
  // Regression: the page stored result[0] as the plan, so an ended or lower subscription listed first
  // replaced the active Flipper plan in the store and on the page.
  const text = await readFile(new URL('../pages/subscriptions.vue', import.meta.url), 'utf8')
  const body = text.slice(text.indexOf('async function getCurrentSubscription'), text.indexOf('const route = useRoute()'))
  assert.match(body, /await userStore\.refreshEntitlements\(\)/)
  assert.match(body, /ownershipGrant\(userStore\.access\)/)
  assert.doesNotMatch(body, /userStore\.currentPlan\s*=/)
  assert.doesNotMatch(body, /result\[0\]/)
  const cancel = text.slice(text.indexOf('async function confirmCancelSubscription'), text.indexOf('async function getCurrentSubscription'))
  assert.match(cancel, /path: \{ id: subscriptionId \}/)
  assert.doesNotMatch(cancel, /result\[0\]/)
})

test('subscriptions page marks the highest tier as current however it was obtained', () => {
  // Regression: a grant-only Flipper saw "Basic" as the current plan and was offered an upgrade to Flipper.
  const grant = { tier: 'flipper', until: '2026-12-26T00:00:00Z', source: 'ownership' }
  assert.deepEqual(displayedPlan(null, grant), { id: 'flipper', endDate: new Date('2026-12-26T00:00:00Z') })
  assert.deepEqual(displayedPlan({ product: 'collector', endsAt: null }, grant), { id: 'flipper', endDate: new Date('2026-12-26T00:00:00Z') })

  // a subscription at least as high as the access keeps its own end date
  const flipperSub = { product: 'flipper', endsAt: '2027-01-05T00:00:00Z' }
  assert.deepEqual(displayedPlan(flipperSub, { tier: 'flipper', until: null, source: 'subscription' }), { id: 'flipper', endDate: new Date('2027-01-05T00:00:00Z') })
  assert.deepEqual(displayedPlan({ product: 'collector', endsAt: '' }, { tier: 'collector', until: null, source: 'subscription' }), { id: 'collector', endDate: null })

  // free users and unknown tiers stay on Basic
  assert.deepEqual(displayedPlan(null, null), { id: 'basic', endDate: null })
  assert.deepEqual(displayedPlan(null, { tier: 'free', until: null, source: null }), { id: 'basic', endDate: null })

  const page = text => text.slice(text.indexOf('function showEntitlements'), text.indexOf('function ownershipGrant'))
  return readFile(new URL('../pages/subscriptions.vue', import.meta.url), 'utf8')
    .then(text => assert.match(page(text), /displayedPlan\(userStore\.currentPlan, userStore\.access\)/))
})

function grantOnlyStore(getStats) {
  const calls = { access: 0 }
  const store = createStore(async () => {
    throw new Error('subscription lookup down')
  }, async () => {
    calls.access++
    return { tier: 'flipper', until: '2999-01-01T00:00:00Z', source: 'ownership' }
  }, getStats)
  store.currentPlan = null
  store.subscriptionStartDate = ''
  store.isAuthenticated = true
  store.isAnonymous = false
  return { store, calls }
}

test('loading the search stats keeps a granted tier instead of clearing and refetching it', async () => {
  // Regression: loadRemainingSearches called the clearing getSubscriptionEndDate whenever the subscription
  // lookup had failed, dropping a grant-only Flipper to free while the overview loaded.
  const { store, calls } = grantOnlyStore(async () => {
    assert.equal(store.effectiveTier, 'flipper')
    return { listenerLimit: 100, listenerCount: 4, searchesUsedMonthly: 1, activeSearchesLeft: 2 }
  })
  await store.ensureEntitlements()
  const result = await store.loadRemainingSearches()
  assert.equal(calls.access, 1)
  assert.equal(store.effectiveTier, 'flipper')
  assert.equal(store.remainingFilters, 96)
  assert.deepEqual(result, { used: 1, total: 2, refreshData: 0 })
})

test('an exhausted cached filter allowance is reloaded before refusing a new filter', async () => {
  // Regression: the allowance only refreshed on the overview, so after a grant or upgrade the filters page
  // kept refusing new filters from the free-tier value.
  let stats = 0
  let limit = 100
  const { store } = grantOnlyStore(async () => {
    stats++
    return { listenerLimit: limit, listenerCount: 3 }
  })
  store.remainingFilters = 0
  assert.equal(await store.canCreateFilter(), true)
  assert.equal(store.remainingFilters, 97)
  assert.equal(await store.canCreateFilter(), true)
  assert.equal(stats, 1, 'a positive allowance needs no reload')

  limit = 3
  store.remainingFilters = 0
  assert.equal(await store.canCreateFilter(), false)
})

test('create filter button asks the store whether a filter may be created', async () => {
  const { descriptor } = parse(await readFile(new URL('../components/ui/CreateFilterButton.vue', import.meta.url), 'utf8'))
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'create-filter-test' }).content)
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g, (_, names) => `const {${names.replace(/\bas\b/g, ':')}} = __vue`)
    .replace(/^import .*$/gm, '').replace('export default', 'return')
  const navigated = []
  const errors = []
  const store = { remainingFilters: 0, canCreateFilter: async () => true }
  const setup = new Function('__vue', 'useUserStore', 'useI18n', 'useLocalePath', 'navigateTo', 'push', code)(
    vue, () => store, () => ({ t: key => key }), () => path => path, url => navigated.push(url), { error: message => errors.push(message) },
  )
  const { checkForAvaiableFilters } = setup.setup({}, { expose() {} })
  await checkForAvaiableFilters('/filters/create')
  assert.deepEqual(navigated, ['/filters/create'])
  store.canCreateFilter = async () => false
  await checkForAvaiableFilters('/filters/create')
  assert.deepEqual(errors, ['noAvailableFilters'])
})
