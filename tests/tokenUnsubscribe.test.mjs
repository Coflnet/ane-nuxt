import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import path from 'node:path'
import test from 'node:test'
import * as vue from 'vue'
import { compileScript, parse } from 'vue/compiler-sfc'

const root = path.resolve(import.meta.dirname, '..')

/** Resolves a site path to its Nuxt page file the way the file router does, `[param]` matching any segment */
async function findPage(urlPath) {
  let dir = path.join(root, 'pages')
  const segments = urlPath.split('/').filter(Boolean)
  for (const [index, segment] of segments.entries()) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
    const last = index === segments.length - 1
    const match = name => name === segment || /^\[[^\]]+\]$/.test(name)
    const hit = entries.find(e => last ? e.isFile() && match(e.name.replace(/\.vue$/, '')) && e.name.endsWith('.vue') : e.isDirectory() && match(e.name))
    if (!hit)
      return null
    dir = path.join(dir, hit.name)
  }
  return dir
}

/** Compiles a single-file component and evaluates it with `modules` standing in for its imports and `globals` for Nuxt auto-imports */
async function loadComponent(file, modules, globals) {
  const { descriptor } = parse(await readFile(file, 'utf8'), { filename: file })
  const compiled = stripTypeScriptTypes(compileScript(descriptor, { id: path.basename(file), inlineTemplate: true }).content)
  const code = compiled
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g, (_, names, source) => `const {${names.replace(/\bas\b/g, ':')}} = __modules[${JSON.stringify(source)}]`)
    .replace('export default', 'return')
  return new Function('__modules', ...Object.keys(globals), code)(modules, ...Object.values(globals))
}

/** Minimal in-memory host for Vue's custom renderer, enough to read text and fire click handlers */
const nodeOps = {
  createElement: tag => ({ tag, props: {}, children: [] }),
  createText: text => ({ text, children: [] }),
  createComment: () => ({ comment: true, children: [] }),
  setText: (node, text) => node.text = text,
  setElementText: (node, text) => node.children = [{ text, children: [], parent: node }],
  insert: (child, parent, anchor) => {
    nodeOps.remove(child)
    const at = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(at < 0 ? parent.children.length : at, 0, child)
    child.parent = parent
  },
  remove: (child) => {
    if (child.parent)
      child.parent.children.splice(child.parent.children.indexOf(child), 1)
    child.parent = null
  },
  parentNode: node => node.parent ?? null,
  nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
  patchProp: (node, key, _, next) => node.props[key] = next,
}

const textOf = node => node.text ?? node.children.map(textOf).join(' ')
const findAll = (node, tag) => [...(node.tag === tag ? [node] : []), ...node.children.flatMap(c => findAll(c, tag))]
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

const slot = (tag, props = () => ({})) => ({
  props: ['label', 'href', 'proccessing'],
  emits: ['onClick'],
  setup: (p, { slots, emit }) => () => vue.h(tag, { ...props(p, emit) }, [p.label, slots.default?.()]),
})

/** Mounts the page an e-mail link opens, with the API client replaced by `api` */
async function openEmailLink(urlPath, query, api) {
  const page = await findPage(urlPath)
  assert.ok(page, `no page handles ${urlPath}, the e-mail link answers 404/500`)

  const calls = []
  const apiClient = {
    getFilterByToken: (options) => {
      calls.push(['GET', options.path])
      return api.get()
    },
    deleteFilterWithToken: (options) => {
      calls.push(['DELETE', options.path])
      return api.remove()
    },
  }
  const params = { id: urlPath.split('/').pop() }
  const globals = {
    ...Object.fromEntries(Object.entries(vue).filter(([name]) => /^[\w$]+$/.test(name))),
    useI18n: () => ({ t: key => key }),
    useRoute: () => ({ params, query }),
    useLocalePath: () => to => typeof to === 'string' ? to : to.path,
    useUserStore: () => ({ isLoggedIn: false }),
    definePageMeta: () => {},
    useSeoMeta: () => {},
  }
  const modules = {
    'vue': vue,
    '~/src/api-client': apiClient,
    '~/utils/tokenUnsubscribe': await import('../utils/tokenUnsubscribe.ts'),
  }

  const card = await loadComponent(path.join(root, 'components/filters/TokenUnsubscribe.vue'), modules, globals)
  const app = vue.createRenderer(nodeOps).createApp(await loadComponent(page, modules, globals))
  app.config.globalProperties.$t = (key, values) => values ? `${key} ${JSON.stringify(values)}` : key
  app.component('FiltersTokenUnsubscribe', card)
  app.component('UiDefaultContainer', slot('div'))
  app.component('UiHeaderLabel', slot('h1'))
  app.component('UiFooterLabel', slot('p'))
  app.component('UiLinkButton', slot('a', p => ({ href: p.href })))
  app.component('UiButton', slot('button', (p, emit) => ({ onClick: () => emit('onClick'), disabled: p.proccessing })))

  const container = { tag: 'root', props: {}, children: [] }
  app.mount(container)
  await settle()
  return { container, calls }
}

// Regression: the unsubscribe link in notification e-mails (/unsubscribe/{id}?token=) had no page
// and answered 500. Mail scanners prefetch that GET link, so opening it may only show a
// confirmation; the filter is deleted only after the explicit button click, and a refused
// DELETE (AneApi answers non-2xx) shows an error instead of claiming success.
test('the e-mail unsubscribe link asks for confirmation and deletes only on click', async () => {
  const { container, calls } = await openEmailLink('/unsubscribe/42', { token: 'abc' }, {
    get: () => Promise.resolve({ name: 'Switch OLED' }),
    remove: () => Promise.resolve(),
  })

  assert.match(textOf(container), /unsubscribeConfirmNamed .*Switch OLED/)
  assert.deepEqual(calls, [['GET', { id: 42, token: 'abc' }]])

  findAll(container, 'button')[0].props.onClick()
  await settle()

  assert.deepEqual(calls.at(-1), ['DELETE', { id: 42, token: 'abc' }])
  assert.match(textOf(container), /unsubscribeSuccess/)
})

test('a refused unsubscribe shows the error and the login link', async () => {
  const { container, calls } = await openEmailLink('/unsubscribe/42', { token: 'abc' }, {
    get: () => Promise.reject(new Error('401')),
    remove: () => Promise.reject(new Error('502 Bad Gateway')),
  })

  assert.match(textOf(container), /unsubscribeConfirm\b/)
  findAll(container, 'button')[0].props.onClick()
  await settle()

  assert.equal(calls.filter(([method]) => method === 'DELETE').length, 1)
  assert.match(textOf(container), /unsubscribeError/)
  assert.doesNotMatch(textOf(container), /unsubscribeSuccess/)
  assert.ok(findAll(container, 'a').some(a => a.props.href === '/login'))
})

test('the e-mail edit link offers the same confirmation without deleting', async () => {
  const { container, calls } = await openEmailLink('/edit/42', { token: 'abc' }, {
    get: () => Promise.resolve({ name: 'Switch OLED' }),
    remove: () => Promise.resolve(),
  })

  assert.match(textOf(container), /unsubscribeButton/)
  assert.match(textOf(container), /editFilter/)
  assert.deepEqual(calls, [['GET', { id: 42, token: 'abc' }]])
})
