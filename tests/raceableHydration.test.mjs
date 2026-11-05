import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as Vue from 'vue'
import { debounce } from 'perfect-debounce'
import { hash } from 'ohash'

const clientCode = source => source.replace(/^import .*$/gm, '').replace(/^export /gm, '')
  .replace(/import\.meta\.(client|server|dev|prerender)/g, (_, flag) => flag === 'client' ? 'true' : 'false')
const nuxtAsyncSource = await readFile(new URL('../node_modules/nuxt/dist/app/composables/asyncData.js', import.meta.url), 'utf8')
const nuxtReadySource = await readFile(new URL('../node_modules/nuxt/dist/app/composables/ready.js', import.meta.url), 'utf8')
const composableSource = await readFile(new URL('../composables/useRaceableAsyncData.ts', import.meta.url), 'utf8')

// Execute the installed Nuxt cache/refresh implementation, not a stub of the failing branch.
function hydrate(payload, fetcher) {
  const hooks = new Map(), mounted = []
  const hook = (name, callback) => {
    if (!hooks.has(name)) hooks.set(name, new Set())
    hooks.get(name).add(callback)
    return () => hooks.get(name).delete(callback)
  }
  const app = {
    isHydrating: true, payload: { serverRendered: true, data: Vue.shallowReactive({ synthetic: payload }), _errors: Vue.shallowReactive({}) },
    static: { data: {} }, _asyncData: Vue.shallowReactive({}), _asyncDataPromises: {}, runWithContext: callback => callback(), hook,
    hooks: {
      hookOnce(name, callback) {
        const remove = hook(name, (...args) => {
          remove()
          return callback(...args)
        })
        return remove
      },
    },
  }
  const ready = new Function('useNuxtApp', 'requestIdleCallback', `${clientCode(nuxtReadySource)}; return onNuxtReady`)(() => app, callback => queueMicrotask(callback))
  const bindings = {
    debounce, hash, useNuxtApp: () => app, onNuxtReady: ready,
    getUserCaller: () => undefined, toArray: value => Array.isArray(value) ? value : [value],
    clientOnlySymbol: Symbol('synthetic-client-only'), createError: error => error,
    asyncDataDefaults: { value: undefined, errorValue: undefined, deep: false },
    granularCachedData: false, pendingWhenIdle: false, purgeCachedData: false, resetAsyncDataToUndefined: true,
  }
  const actualAsyncData = new Function('Vue', 'bindings', `with (bindings) { const { computed, getCurrentInstance, getCurrentScope, inject, isShallow, nextTick, onBeforeMount, onScopeDispose, onServerPrefetch, onUnmounted, queuePostFlushCb, ref, shallowRef, toRef, toValue, unref, watch } = Vue; ${clientCode(nuxtAsyncSource)}; return useAsyncData }`)(Vue, bindings)
  const useRaceable = new Function('computed', 'useRuntimeConfig', 'useAsyncData', 'onMounted', 'onNuxtReady', `${clientCode(stripTypeScriptTypes(composableSource))}; return useRaceableAsyncData`)(Vue.computed, () => ({ public: { ssrFetchTimeoutMs: 2500 } }), actualAsyncData, callback => mounted.push(callback), ready)
  const scope = Vue.effectScope()
  const result = scope.run(() => useRaceable('synthetic', fetcher))
  const settle = async () => {
    for (let i = 0; i < 12; i++) await Vue.nextTick()
  }
  return {
    result, app,
    async mount() {
      for (const callback of mounted) callback()
      await settle()
    },
    async finishHydration() {
      app.isHydrating = false
      for (const callback of [...(hooks.get('app:suspense:resolve') ?? [])]) callback()
      await settle()
    },
    stop: () => scope.stop(),
  }
}

test('timed-out SSR payload recovers once after hydration instead of reusing the timeout cache', async () => {
  let calls = 0
  const response = { total: 90146, products: [{ seoId: 'synthetic' }], priceCurrency: 'EUR' }
  const state = hydrate({ data: null, timedOut: true }, async () => {
    calls++
    return response
  })
  try {
    assert.equal(state.result.loading.value, true)
    await state.mount()
    assert.equal(calls, 0, 'Do not refresh against the still-hydrating cache')
    await state.finishHydration()
    assert.equal(calls, 1, 'A timed-out SSR wrapper must trigger the actual client fetcher')
    assert.deepEqual(state.result.data.value, response)
    assert.equal(state.result.loading.value, false)
    assert.equal(state.result.error.value, undefined)
  }
  finally { state.stop() }
})

test('successful SSR payload remains cached without a hydration refresh', async () => {
  let calls = 0
  const response = { total: 90146 }
  const state = hydrate({ data: response, timedOut: false }, async () => {
    calls++
  })
  try {
    await state.mount()
    await state.finishHydration()
    assert.equal(calls, 0)
    assert.deepEqual(state.result.data.value, response)
    assert.equal(state.result.loading.value, false)
  }
  finally { state.stop() }
})

test('a failed timeout recovery exposes the current error and keeps explicit retry usable', async () => {
  let calls = 0
  const failure = new Error('Synthetic temporary outage')
  const state = hydrate({ data: null, timedOut: true }, async () => {
    if (++calls === 1) throw failure
    return { total: 10032 }
  })
  try {
    await state.mount()
    await state.finishHydration()
    assert.equal(calls, 1)
    assert.equal(state.result.error.value, failure)
    assert.equal(state.result.loading.value, false)
    await state.result.refresh()
    assert.equal(calls, 2)
    assert.deepEqual(state.result.data.value, { total: 10032 })
    assert.equal(state.result.error.value, undefined)
  }
  finally { state.stop() }
})
