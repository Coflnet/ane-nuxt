import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import * as queue from '../utils/labelingQueue.ts'
import * as sender from '../utils/labelingSender.ts'
import { shortcutFor } from '../utils/labelingShortcuts.ts'

// Mount the actual compiled page with Vue's renderer. No Nuxt server, auth service or
// image network is needed; button events and reactive DOM updates still run normally.
async function mountPage(api) {
  const source = await readFile(new URL('../pages/labeling.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  let code = stripTypeScriptTypes(compileScript(descriptor, { id: 'labeling-test', inlineTemplate: true }).content)
  code = code.replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, names) => `const {${names.replaceAll(' as ', ': ')}} = Vue`)
    .replace(/^import .*$/gm, '')
    .replace('export default', 'return')
    .replaceAll('import.meta.server', 'false').replaceAll('import.meta.client', 'true')
  const component = new Function('Vue', 'queue', 'sender', 'api', 'shortcutFor', `
    const { answer, BATCH_SIZE, createQueueState, enqueue, needsRefill, remaining, rollback, skip, undo, upcoming } = queue;
    const { createLabelSender } = sender;
    const useHead = () => {}, useSeoMeta = () => {}, useLocalePath = () => value => value;
    const useLabelingApi = () => api, useUserStore = () => ({ isLoggedIn: true, token: 'test' });
    const labelingErrorStatus = () => 0, LabelingStatsPanel = { render: () => null };
    ${code}`)(Vue, queue, sender, api, shortcutFor)
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
  globalThis.window = { addEventListener() {}, removeEventListener() {}, getRootNode: () => ({ activeElement: null }) }
  globalThis.Image = class {}
  globalThis.Document = class {}
  globalThis.ShadowRoot = class {}
  app.mount(root)
  const settle = async () => {
    for (let i = 0; i < 8; i++) await Vue.nextTick()
  }
  const all = (n = root) => [n, ...n.children.flatMap(child => all(child))]
  const find = id => all().find(n => n.props['data-testid'] === id)
  const click = async (id) => {
    assert.ok(find(id), id)
    find(id).props.onClick()
    await settle()
  }
  await settle()
  return { root, all, find, click, settle, unmount: () => app.unmount() }
}

const diagnosticPair = n => ({ pairId: `p${n}`, groupKey: `secret-model-${n}`, similarity: 0.987, decision: 'secret-decision',
  a: { platform: 'source-a', imageUrl: '/a.png', listingUrl: '/offer-a' },
  b: { platform: 'source-b', imageUrl: '/b.png', listingUrl: '/offer-b' } })

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
