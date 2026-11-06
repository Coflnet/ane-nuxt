import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import * as queue from '../utils/labelingQueue.ts'
import * as sender from '../utils/labelingSender.ts'
import { shortcutFor } from '../utils/labelingShortcuts.ts'

const photoLoadEvent = photo => ({ target: { currentSrc: photo.props.src } })

// Mount the actual compiled page with Vue's renderer. No Nuxt server, auth service or
// image network is needed; button events and reactive DOM updates still run normally.
async function mountPage(api, autoLoadPhotos = true) {
  let leave
  const listeners = new Map()
  const source = await readFile(new URL('../pages/labeling.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  let code = stripTypeScriptTypes(compileScript(descriptor, { id: 'labeling-test', inlineTemplate: true }).content)
  code = code.replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace(/^import .*$/gm, '')
    .replace('export default', 'return')
    .replaceAll('import.meta.server', 'false').replaceAll('import.meta.client', 'true')
  const component = new Function('Vue', 'queue', 'sender', 'api', 'shortcutFor', 'registerLeave', `
    const { answer, BATCH_SIZE, createQueueState, enqueue, needsRefill, remaining, rollback, skip, undo, upcoming } = queue;
    const { createLabelSender } = sender;
    const useHead = () => {}, useSeoMeta = () => {}, useLocalePath = () => value => value;
    const useI18n = () => ({ t: key => key }), onBeforeRouteLeave = registerLeave;
    const useLabelingApi = () => ({ photo: async () => new Blob(['synthetic fixture']), ...api }), useUserStore = () => ({ isLoggedIn: true, token: 'test' });
    const labelingErrorStatus = () => 0, LabelingStatsPanel = { render: () => null };
    ${code}`)(Vue, queue, sender, api, shortcutFor, (guard) => { leave = guard })
  const node = (type, text = '') => ({ type, tagName: type.toUpperCase(), text, props: {}, children: [], parent: null, addEventListener() {}, removeEventListener() {}, getRootNode: () => ({ activeElement: null }) })
  const renderer = Vue.createRenderer({
    createElement: node, createText: text => node('#text', text), createComment: text => node('#comment', text),
    setText: (n, text) => { n.text = text }, setElementText: (n, text) => {
      n.text = text
      n.children = []
    },
    parentNode: n => n.parent, nextSibling: n => n.parent?.children[n.parent.children.indexOf(n) + 1],
    patchProp: (n, key, _old, value) => { n.props[key] = value },
    insert(n, parent, anchor) {
      if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1)
      n.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, n)
    },
    remove(n) {
      if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1)
      n.parent = null
    },
  })
  const root = node('root')
  const app = renderer.createApp(component)
  app.config.globalProperties.$t = key => key
  app.config.errorHandler = (error) => {
    throw error
  }
  app.config.warnHandler = (message) => {
    if (!message.includes('resolve component')) throw new Error(message)
  }
  globalThis.window = { confirm: () => false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name), getRootNode: () => ({ activeElement: null }) }
  globalThis.Image = class {
    set src(value) { throw new Error(`Unexpected live image preload: ${value}`) }
  }
  globalThis.Document = class {}
  globalThis.ShadowRoot = class {}
  app.mount(root)
  const settle = async () => {
    for (let i = 0; i < 8; i++) {
      await Vue.nextTick()
      if (autoLoadPhotos) for (const photo of all().filter(n => n.type === 'img')) photo.props.onLoad?.(photoLoadEvent(photo))
    }
  }
  const all = (n = root) => [n, ...n.children.flatMap(child => all(child))]
  const find = id => all().find(n => n.props['data-testid'] === id)
  const click = async (id) => {
    assert.ok(find(id), id)
    find(id).props.onClick()
    await settle()
  }
  await settle()
  return { root, all, find, click, settle, listeners, leave: () => leave?.(), unmount: () => app.unmount() }
}

const diagnosticPair = n => ({ pairId: `p${n}`, groupKey: `secret-model-${n}`, similarity: 0.987, decision: 'secret-decision',
  a: { platform: 'source-a', imageUrl: '/a.png', archivedImageUrl: `/api/labeling/p${n}/photo/a`, listingUrl: '/offer-a' },
  b: { platform: 'source-b', imageUrl: '/b.png', archivedImageUrl: `/api/labeling/p${n}/photo/b`, listingUrl: '/offer-b' } })

const pair = (n) => {
  const { pairId, a, b } = diagnosticPair(n)
  return { pairId, a, b }
}

test('rendered review hides diagnostics, tracks exposure through hide/skip/undo, and retries the original answer', async () => {
  const calls = []
  const reveals = []
  let fail = true
  const view = await mountPage({
    me: async () => ({ canLabel: true, userId: 'reviewer' }), stats: async () => null,
    next: async () => [pair(1), pair(2)],
    diagnostics: async (id) => {
      reveals.push(id)
      return diagnosticPair(Number(id.slice(1)))
    },
    label: async (...args) => {
      calls.push(args)
      if (fail) {
        fail = false
        throw new Error('temporary')
      }
    },
  })
  try {
    const visible = () => view.all().map(n => `${n.text} ${JSON.stringify(n.props)}`).join(' ')
    assert.deepEqual(reveals, [])
    assert.ok(!visible().includes('secret-model'))
    assert.ok(!visible().includes('secret-decision'))
    assert.ok(!visible().includes('0.987'))
    assert.ok(!view.all().some(n => n.type === 'a'))
    assert.match(view.find('labeling-review-mode').text, /labelingBlindReview/)
    await view.click('labeling-diagnostics-toggle')
    assert.deepEqual(reveals, ['p1'])
    assert.ok(view.find('labeling-group'))
    assert.ok(visible().includes('secret-model-1'))
    await view.click('labeling-diagnostics-toggle')
    assert.equal(view.find('labeling-score'), undefined)
    assert.match(view.find('labeling-review-mode').text, /labelingDiagnosticReview/)
    await view.click('labeling-answer-1')
    assert.deepEqual(calls[0], ['p1', 'same_item', 'diagnostic'])
    assert.match(view.find('labeling-review-mode').text, /labelingBlindReview/)
    // The failed pair returns behind the current pair, preserving its selected answer.
    await view.click('labeling-skip')
    assert.match(view.find('labeling-review-mode').text, /labelingDiagnosticReview/)
    assert.ok(view.find('labeling-previous-answer'))
    await view.click('labeling-retry')
    assert.deepEqual(calls[1], calls[0])
    await view.click('labeling-undo')
    assert.match(view.find('labeling-review-mode').text, /labelingDiagnosticReview/)
    assert.ok(view.find('labeling-previous-answer'))
    await view.click('labeling-answer-3')
    assert.deepEqual(calls[2], ['p1', 'different', 'diagnostic'])
    await view.click('labeling-answer-4')
    assert.deepEqual(calls[3], ['p2', 'unsure', 'blind'])
  }
  finally {
    view.unmount()
    delete globalThis.window
    delete globalThis.Image
    delete globalThis.Document
    delete globalThis.ShadowRoot
  }
})

test('group filtering records diagnostic exposure even when details are hidden', async () => {
  const calls = []
  const batches = []
  const view = await mountPage({
    me: async () => ({ canLabel: true, userId: 'reviewer' }), stats: async () => null,
    diagnostics: async id => diagnosticPair(Number(id.slice(1))),
    next: async (...args) => {
      batches.push(args)
      return [pair(batches.length)]
    },
    label: async (...args) => { calls.push(args) },
  })
  try {
    await view.click('labeling-diagnostics-toggle')
    const input = view.all().find(n => n.props.id === 'labeling-group-filter')
    input.props['onUpdate:modelValue']('chosen model')
    await view.settle()
    view.all().find(n => n.type === 'form').props.onSubmit({ preventDefault() {} })
    await view.settle()
    assert.equal(batches.at(-1)[1], 'chosen model')
    assert.equal(view.find('labeling-group'), undefined)
    assert.match(view.find('labeling-review-mode').text, /labelingDiagnosticReview/)
    await view.click('labeling-answer-2')
    assert.deepEqual(calls[0], ['p2', 'same_model_other_variant', 'diagnostic'])
  }
  finally {
    view.unmount()
    delete globalThis.window
    delete globalThis.Image
    delete globalThis.Document
    delete globalThis.ShadowRoot
  }
})

test('diagnostics can be retried without replacing the pair or its answer, and stale responses stay off the next pair', async () => {
  const calls = []
  let attempts = 0
  let finish
  const view = await mountPage({
    me: async () => ({ canLabel: true, userId: 'reviewer' }), stats: async () => null,
    next: async () => [pair(1), pair(2)],
    diagnostics: async () => {
      if (++attempts === 1) throw new Error('temporary')
      return new Promise((resolve) => {
        finish = resolve
      })
    },
    label: async (...args) => { calls.push(args) },
  })
  try {
    await view.click('labeling-diagnostics-toggle')
    assert.ok(view.find('labeling-diagnostics-error'))
    await view.click('labeling-diagnostics-retry')
    await view.click('labeling-answer-3')
    assert.deepEqual(calls[0], ['p1', 'different', 'diagnostic'])
    finish(diagnosticPair(1))
    await view.settle()
    assert.equal(view.find('labeling-group'), undefined)
    assert.match(view.find('labeling-review-mode').text, /labelingBlindReview/)
    await view.click('labeling-undo')
    assert.ok(view.find('labeling-previous-answer'))
    assert.match(view.find('labeling-review-mode').text, /labelingDiagnosticReview/)
  }
  finally {
    view.unmount()
    delete globalThis.window
    delete globalThis.Image
    delete globalThis.Document
    delete globalThis.ShadowRoot
  }
})

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const savedCount = view => view.find('labeling-session').children.find(n => n.type === 'span').text
const reviewApi = label => ({
  me: async () => ({ canLabel: true, userId: 'reviewer' }), stats: async () => null,
  next: async () => [pair(1), pair(2)], label,
})

test('pending answers are not counted as saved; acknowledgement clears navigation protection', async () => {
  const save = deferred()
  const view = await mountPage(reviewApi(() => save.promise))
  try {
    assert.equal(view.find('labeling-save-status'), undefined)
    await view.click('labeling-answer-1')
    assert.equal(savedCount(view), '0')
    assert.match(view.find('labeling-save-status').text, /labelingSaving/)
    assert.equal(view.leave(), false)
    let prevented = false
    view.listeners.get('beforeunload')({ preventDefault() {
      prevented = true
    } })
    assert.equal(prevented, true)
    save.resolve()
    await view.settle()
    assert.equal(savedCount(view), '1')
    assert.match(view.find('labeling-save-status').text, /labelingAllSaved/)
    assert.equal(view.leave(), true)
    prevented = false
    view.listeners.get('beforeunload')({ preventDefault() {
      prevented = true
    } })
    assert.equal(prevented, false)
  }
  finally { view.unmount() }
})

test('failed saves stay visible through another successful answer and retry acknowledges recovery', async () => {
  const first = deferred()
  let calls = 0
  const view = await mountPage(reviewApi(() => ++calls === 1 ? first.promise : Promise.resolve()))
  try {
    await view.click('labeling-answer-1')
    first.reject(new Error('temporary'))
    await view.settle()
    assert.equal(savedCount(view), '0')
    assert.ok(view.find('labeling-save-error'))
    await view.click('labeling-answer-3')
    assert.equal(savedCount(view), '1')
    assert.ok(view.find('labeling-save-error'))
    assert.equal(view.find('labeling-save-status'), undefined)
    assert.equal(view.leave(), false)
    await view.click('labeling-retry')
    assert.equal(savedCount(view), '2')
    assert.equal(view.find('labeling-save-error'), undefined)
    assert.match(view.find('labeling-save-status').text, /labelingAllSaved/)
    assert.equal(view.leave(), true)
  }
  finally { view.unmount() }
})

test('undo and queued replacement count only the latest acknowledged answer and preserve post order', async () => {
  const first = deferred(), second = deferred()
  const calls = []
  const view = await mountPage(reviewApi((...args) => {
    calls.push(args)
    return calls.length === 1 ? first.promise : second.promise
  }))
  try {
    await view.click('labeling-answer-1')
    await view.click('labeling-undo')
    await view.click('labeling-answer-3')
    assert.equal(calls.length, 1)
    first.resolve()
    await view.settle()
    assert.deepEqual(calls.map(c => c[1]), ['same_item', 'different'])
    assert.equal(savedCount(view), '0')
    assert.match(view.find('labeling-save-status').text, /labelingSaving/)
    second.resolve()
    await view.settle()
    assert.equal(savedCount(view), '1')
    await view.click('labeling-undo')
    assert.equal(savedCount(view), '1', 'undo reopens a pair but does not remove the saved server answer')
    assert.equal(view.leave(), true)
  }
  finally { view.unmount() }
})

test('a save failure after undo remains recoverable without a duplicate pair', async () => {
  const save = deferred()
  const view = await mountPage(reviewApi(() => save.promise))
  try {
    await view.click('labeling-answer-1')
    await view.click('labeling-undo')
    save.reject(new Error('temporary'))
    await view.settle()
    assert.ok(view.find('labeling-save-error'))
    assert.ok(view.find('labeling-retry'))
    assert.equal(view.leave(), false)
  }
  finally { view.unmount() }
})

test('late failure beyond undo history returns the pair for retry and survives a reload attempt', async () => {
  const first = deferred()
  let calls = 0, batches = 0
  const api = reviewApi(() => ++calls === 1 ? first.promise : Promise.resolve())
  api.next = async () => {
    batches++
    return Array.from({ length: 53 }, (_, i) => pair(i + 1))
  }
  const view = await mountPage(api)
  try {
    for (let i = 0; i < 52; i++) await view.click('labeling-answer-3')
    first.reject(new Error('late temporary failure'))
    await view.settle()
    assert.equal(savedCount(view), '51')
    assert.ok(view.find('labeling-save-error'))
    // Reload/filter must not discard the only retryable copy of a failed answer.
    const batchesBeforeFilter = batches
    await view.click('labeling-diagnostics-toggle')
    const input = view.all().find(n => n.props.id === 'labeling-group-filter')
    input.props['onUpdate:modelValue']('another group')
    view.all().find(n => n.type === 'form').props.onSubmit({ preventDefault() {} })
    await view.settle()
    assert.equal(batches, batchesBeforeFilter)
    await view.click('labeling-skip')
    assert.ok(view.find('labeling-retry'))
    await view.click('labeling-retry')
    assert.equal(savedCount(view), '52')
    assert.equal(view.find('labeling-save-error'), undefined)
  }
  finally { view.unmount() }
})

const unarchivedPair = n => ({
  ...pair(n), a: { ...pair(n).a, archivedImageUrl: undefined }, b: { ...pair(n).b, archivedImageUrl: undefined },
})

test('missing archives never display or preload live images, and skip does not save a label', async () => {
  const calls = []
  const api = reviewApi((...args) => calls.push(args))
  api.next = async () => [unarchivedPair(1), unarchivedPair(2)]
  const view = await mountPage(api)
  try {
    assert.ok(view.find('labeling-placeholder-a'))
    assert.ok(view.find('labeling-placeholder-b'))
    assert.equal(view.find('labeling-photo-a'), undefined)
    assert.equal(view.find('labeling-photo-retry-a'), undefined)
    await view.click('labeling-skip')
    assert.ok(view.find('labeling-placeholder-a'))
    assert.deepEqual(calls, [])
  }
  finally { view.unmount() }
})

test('archive fetch and decode failures retry the archive and preserve an unfinished answer', async () => {
  const photos = [], labels = []
  let fail = false
  const api = reviewApi(async (...args) => {
    labels.push(args)
    throw new Error('save unavailable')
  })
  api.next = async () => [pair(1), pair(2)]
  api.photo = async (url) => {
    photos.push(url)
    if (fail) throw new Error('archive unavailable')
    return new Blob(['synthetic test image'])
  }
  const view = await mountPage(api)
  try {
    assert.deepEqual(new Set(photos), new Set([
      '/api/labeling/p1/photo/a', '/api/labeling/p1/photo/b',
      '/api/labeling/p2/photo/a', '/api/labeling/p2/photo/b',
    ]))
    await view.click('labeling-answer-1')
    await view.click('labeling-skip')
    fail = true
    view.find('labeling-photo-a').props.onError()
    view.find('labeling-photo-b').props.onError()
    await view.settle()
    await view.click('labeling-photo-retry-a')
    assert.ok(view.find('labeling-placeholder-a'))
    assert.ok(view.find('labeling-previous-answer'))
    assert.ok(view.find('labeling-save-error'))
    assert.equal(view.leave(), false)
    fail = false
    await view.click('labeling-photo-retry-a')
    assert.match(view.find('labeling-photo-a').props.src, /^blob:/)
    view.find('labeling-photo-a').props.onError()
    await view.settle()
    assert.ok(view.find('labeling-placeholder-a'))
    const beforeRetry = photos.length
    await view.click('labeling-photo-retry-a')
    assert.equal(photos.length, beforeRetry + 1, 'decode retry fetches a new archived blob')
    assert.equal(photos.at(-1), '/api/labeling/p1/photo/a')
    assert.match(view.find('labeling-photo-a').props.src, /^blob:/)
    assert.ok(view.find('labeling-previous-answer'))
    assert.ok(view.find('labeling-save-error'))
    assert.equal(view.leave(), false)
    assert.deepEqual(labels, [['p1', 'same_item', 'blind']])
  }
  finally { view.unmount() }
})

test('a late archive response cannot replace the next pair or its missing-archive placeholder', async () => {
  const pending = deferred()
  const api = reviewApi(async () => {})
  api.next = async () => [pair(1), unarchivedPair(2)]
  api.photo = () => pending.promise
  const view = await mountPage(api)
  try {
    assert.ok(view.find('labeling-photo-loading-a'))
    await view.click('labeling-skip')
    assert.ok(view.find('labeling-placeholder-a'))
    pending.resolve(new Blob(['synthetic test image']))
    await view.settle()
    assert.ok(view.find('labeling-placeholder-a'))
    assert.equal(view.find('labeling-photo-a'), undefined)
  }
  finally { view.unmount() }
})

const key = async (view, value) => {
  view.listeners.get('keydown')({ key: value, preventDefault() {} })
  await view.settle()
}
const answersDisabled = view => ['1', '2', '3', '4'].every(n => view.find(`labeling-answer-${n}`)?.props.disabled === true)

test('new button and hotkey answers require both browser-loaded archived photos', async () => {
  const photos = deferred(), labels = []
  const api = reviewApi(async (...args) => {
    labels.push(args)
  })
  api.photo = () => photos.promise
  const view = await mountPage(api, false)
  try {
    assert.ok(answersDisabled(view), 'blob fetch still pending')
    await key(view, '1')
    await view.click('labeling-answer-2')
    assert.deepEqual(labels, [])
    photos.resolve(new Blob(['synthetic fixture']))
    await view.settle()
    assert.ok(view.find('labeling-photo-a'))
    assert.ok(answersDisabled(view), 'blob URL alone does not prove browser decode/load')
    await key(view, '3')
    assert.deepEqual(labels, [])
    view.find('labeling-photo-a').props.onLoad(photoLoadEvent(view.find('labeling-photo-a')))
    await view.settle()
    assert.ok(answersDisabled(view), 'only one of two photos has loaded')
    await key(view, '4')
    assert.deepEqual(labels, [])
    view.find('labeling-photo-b').props.onLoad(photoLoadEvent(view.find('labeling-photo-b')))
    await view.settle()
    assert.equal(answersDisabled(view), false)
    await key(view, '1')
    assert.deepEqual(labels, [['p1', 'same_item', 'blind']])
    assert.ok(answersDisabled(view), 'each new pair must load its own photos')
  }
  finally { view.unmount() }
})

test('missing or rejected archives block new labels while skip remains usable', async () => {
  for (const missing of [true, false]) {
    const labels = []
    const api = reviewApi(async (...args) => {
      labels.push(args)
    })
    api.next = async () => [missing ? { ...pair(1), b: unarchivedPair(1).b } : pair(1), pair(2)]
    if (!missing) api.photo = async () => {
      throw new Error('archive fetch failed')
    }
    const view = await mountPage(api)
    try {
      assert.ok(answersDisabled(view))
      for (const value of ['1', '2', '3', '4']) await key(view, value)
      await view.click('labeling-answer-1')
      assert.deepEqual(labels, [])
      const before = view.find('labeling-pair')
      await key(view, 's')
      assert.notEqual(view.find('labeling-pair'), before, 'skip moves to the next pair without a label')
      assert.deepEqual(labels, [])
    }
    finally { view.unmount() }
  }
})

test('decode failure blocks new labels until the retried archive loads, and undo remains usable', async () => {
  const labels = []
  const view = await mountPage(reviewApi(async (...args) => {
    labels.push(args)
  }), false)
  try {
    assert.ok(answersDisabled(view), 'both browser loads are pending')
    view.find('labeling-photo-a').props.onLoad(photoLoadEvent(view.find('labeling-photo-a')))
    view.find('labeling-photo-b').props.onError()
    await view.settle()
    assert.ok(view.find('labeling-placeholder-b'))
    assert.ok(answersDisabled(view))
    await key(view, '1')
    assert.deepEqual(labels, [])
    await view.click('labeling-photo-retry-b')
    assert.ok(answersDisabled(view), 'retry must also await decode/load')
    view.find('labeling-photo-b').props.onLoad(photoLoadEvent(view.find('labeling-photo-b')))
    await view.settle()
    await view.click('labeling-answer-3')
    assert.deepEqual(labels, [['p1', 'different', 'blind']])
    await key(view, 'z')
    assert.ok(view.find('labeling-previous-answer'))
    assert.ok(answersDisabled(view), 'undo restores review state but does not bypass loading')
  }
  finally { view.unmount() }
})

test('failed-save retry resends the prior label when an archived photo later becomes unavailable', async () => {
  const labels = []
  let fail = true
  const view = await mountPage(reviewApi(async (...args) => {
    labels.push(args)
    if (fail) throw new Error('save failed')
  }))
  try {
    await view.click('labeling-answer-2')
    await view.click('labeling-skip')
    view.find('labeling-photo-b').props.onError()
    await view.settle()
    assert.ok(answersDisabled(view))
    await key(view, '3')
    await view.click('labeling-answer-4')
    assert.deepEqual(labels, [['p1', 'same_model_other_variant', 'blind']])
    assert.ok(view.find('labeling-previous-answer'))
    assert.equal(view.leave(), false)
    fail = false
    await view.click('labeling-retry')
    assert.deepEqual(labels[1], labels[0])
    assert.equal(view.find('labeling-save-error'), undefined)
    assert.equal(view.leave(), true)
  }
  finally { view.unmount() }
})

test('a retained load callback cannot mark a different current archive loaded after skip, undo or retry', async () => {
  for (const transition of ['skip', 'undo', 'retry']) {
    const labels = []
    const view = await mountPage(reviewApi(async (...args) => {
      labels.push(args)
    }), false)
    try {
      if (transition === 'undo') {
        for (const side of ['a', 'b']) {
          const photo = view.find(`labeling-photo-${side}`)
          photo.props.onLoad(photoLoadEvent(photo))
        }
        await view.settle()
        await view.click('labeling-answer-1')
      }
      const oldPhoto = view.find('labeling-photo-a')
      const oldLoad = oldPhoto.props.onLoad
      const oldEvent = photoLoadEvent(oldPhoto)
      if (transition === 'skip') await key(view, 's')
      else if (transition === 'undo') await key(view, 'z')
      else {
        oldPhoto.props.onError()
        await view.settle()
        await view.click('labeling-photo-retry-a')
      }
      const currentA = view.find('labeling-photo-a')
      const currentB = view.find('labeling-photo-b')
      assert.notEqual(currentA.props.src, oldEvent.target.currentSrc, transition)
      currentB.props.onLoad(photoLoadEvent(currentB))
      await view.settle()
      assert.ok(answersDisabled(view), `${transition}: current A still awaits its load`)
      const before = [...labels]
      oldLoad(oldEvent)
      await view.settle()
      assert.ok(answersDisabled(view), `${transition}: old currentSrc must not clear the new loading state`)
      await key(view, '3')
      assert.deepEqual(labels, before)
      currentA.props.onLoad(photoLoadEvent(currentA))
      await view.settle()
      assert.equal(answersDisabled(view), false, `${transition}: valid current load enables answers`)
      await key(view, '3')
      assert.deepEqual(labels.at(-1), [transition === 'skip' ? 'p2' : 'p1', 'different', 'blind'])
    }
    finally { view.unmount() }
  }
})
