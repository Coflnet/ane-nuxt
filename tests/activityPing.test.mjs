import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createPinia, defineStore } from 'pinia'
import * as vue from 'vue'
import * as activityPing from '../utils/activityPing.ts'
import { activityPingIntervalMs, pingActivity } from '../utils/activityPing.ts'

function memoryStorage() {
  const items = new Map()
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) }
}

// Filters of users without website activity for 30 days are paused; the website reports
// activity on page renders but at most once per hour and user per browser.
test('the activity ping is sent once per hour per user and ignores failures', async () => {
  const sent = []
  let now = 1_000_000
  const deps = {
    storage: memoryStorage(),
    now: () => now,
    send: (token) => {
      sent.push(token)
      return Promise.reject(new Error('offline'))
    },
  }

  assert.equal(pingActivity(null, deps), false)
  assert.equal(pingActivity('user-a', deps), true)
  assert.equal(pingActivity('user-a', deps), false)
  now += activityPingIntervalMs - 1
  assert.equal(pingActivity('user-a', deps), false)
  assert.equal(pingActivity('user-b', deps), true)
  now += activityPingIntervalMs
  assert.equal(pingActivity('user-b', deps), true)
  assert.deepEqual(sent, ['user-a', 'user-b', 'user-b'])
  await new Promise(resolve => setTimeout(resolve, 0))
})

test('the activity ping stays debounced when storage is unavailable or throws', () => {
  const sent = []
  const blocked = () => {
    throw new Error('blocked')
  }
  const failing = { getItem: blocked, setItem: blocked }
  const send = (token) => {
    sent.push(token)
    return Promise.resolve()
  }

  for (const storage of [null, failing]) {
    const deps = { storage, now: () => 5_000_000, send }
    const token = `no-storage-${sent.length}`
    assert.equal(pingActivity(token, deps), true)
    assert.equal(pingActivity(token, deps), false)
  }
  assert.equal(sent.length, 2)
})

test('a failed write does not let an expired stored record ping again', () => {
  const sent = []
  let now = 9_000_000
  const items = new Map()
  let writable = true
  const storage = {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => {
      if (!writable)
        throw new Error('quota')
      items.set(key, value)
    },
  }
  const deps = { storage, now: () => now, send: token => sent.push(token) && Promise.resolve() }

  assert.equal(pingActivity('stale-store', deps), true)
  writable = false
  now += activityPingIntervalMs
  assert.equal(pingActivity('stale-store', deps), true)
  assert.equal(pingActivity('stale-store', deps), false)
  assert.equal(sent.length, 2)
})

/** Evaluates the Nuxt plugin with `modules` standing in for its imports and `globals` for Nuxt auto-imports */
async function loadPlugin(modules, globals) {
  const code = stripTypeScriptTypes(await readFile(new URL('../plugins/activity-ping.client.ts', import.meta.url), 'utf8'))
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g, (_, names, source) => `const {${names}} = __modules[${JSON.stringify(source)}]`)
    .replace('export default', 'return')
  return new Function('__modules', ...Object.keys(globals), code)(modules, ...Object.values(globals))
}

// Nuxt runs client plugins alphabetically, activity-ping before piniaPersist: creating the user
// store in the plugin itself kept the persisted session from being restored on reload.
test('the activity plugin leaves the persisted session to be restored', async () => {
  const pinia = createPinia()
  vue.createApp({}).use(pinia)
  const useUserStore = defineStore('user', () => ({ token: vue.ref(null) }))
  const hooks = {}
  const posted = []
  const modules = {
    '~/src/api-client/client.gen': { client: { post: (options) => {
      posted.push(options.headers.Authorization)
      return Promise.resolve()
    } } },
    '~/utils/activityPing': activityPing,
  }
  const globals = { defineNuxtPlugin: setup => setup, useUserStore: () => useUserStore(pinia), watch: vue.watch, window: { localStorage: null } }

  const plugin = await loadPlugin(modules, globals)
  plugin({ hook: (name, fn) => hooks[name] = fn })
  // what piniaPersist does after this plugin: restore the stored session into stores created later
  pinia.use(({ store }) => store.$patch({ token: 'restored-session' }))
  hooks['app:mounted']?.()
  hooks['page:finish']()

  assert.equal(useUserStore(pinia).token, 'restored-session')
  assert.deepEqual(posted, ['Bearer restored-session'])
})
