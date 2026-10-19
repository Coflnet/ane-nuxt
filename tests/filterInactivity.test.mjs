import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import path from 'node:path'
import test from 'node:test'
import * as vue from 'vue'
import { compileScript, parse } from 'vue/compiler-sfc'

const root = path.resolve(import.meta.dirname, '..')

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
  props: ['label', 'proccessing'],
  emits: ['onClick'],
  setup: (p, { slots, emit }) => () => vue.h(tag, { ...props(p, emit) }, [p.label, slots.default?.()]),
})

/** Mounts /filters with the stored filters `listeners`, as AneApi returns them */
async function openFiltersPage(listeners) {
  const reactivated = []
  const filterStore = {
    getUserFilters: listeners,
    getSimplifiedFilters: Object.fromEntries(listeners.map(l => [l.id, [l.name, l.id]])),
    loadFilters: () => {},
    reactivateFilter: async id => reactivated.push(id),
  }
  const globals = {
    ...Object.fromEntries(Object.entries(vue).filter(([name]) => /^[\w$]+$/.test(name))),
    useI18n: () => ({ t: key => key }),
    useLocalePath: () => to => to,
    useFilterStore: () => filterStore,
    useUserStore: () => ({ checkAuth: async () => {} }),
    useFirebaseAuth: () => ({}),
    useSeoMeta: () => {},
    push: { success: () => {}, error: () => {} },
  }
  // optional, so that the page as it was before reaches the assertions instead of failing to load
  const filterState = await import('../utils/filterState.ts').catch(() => ({}))
  const modules = { 'vue': vue, '~/utils/filterState': filterState }

  const item = await loadComponent(path.join(root, 'components/filters/filterView/FilterItem.vue'), modules, globals)
  const app = vue.createRenderer(nodeOps).createApp(await loadComponent(path.join(root, 'pages/filters/index.vue'), modules, globals))
  app.config.globalProperties.$t = key => key
  app.component('FiltersFilterViewFilterItem', item)
  for (const name of ['UiHeaderLabel', 'UiFooterLabel', 'UiCreateFilterButton', 'UiDefaultContainer', 'UiGrid', 'Icon', 'FiltersFilterViewItemHeader', 'FiltersFilterViewItemSettings'])
    app.component(name, slot('div'))
  app.component('UiButton', slot('button', (p, emit) => ({ onClick: () => emit('onClick'), disabled: p.proccessing })))

  const container = { tag: 'root', props: {}, children: [] }
  app.mount(container)
  await settle()
  return { container, reactivated }
}

// The page hard-coded every filter as active, a filter AneNotifier paused after 30 days without
// website activity looked like it still notified and could not be switched back on.
test('a filter paused for inactivity is marked paused and reactivates on click', async () => {
  const { container, reactivated } = await openFiltersPage([
    { id: 7, name: 'Switch', state: 'DisabledInactive' },
    { id: 8, name: 'Lego', state: 'None' },
  ])

  assert.equal(textOf(container).match(/filterPausedInactive/g)?.length, 1)
  const buttons = findAll(container, 'button')
  assert.equal(buttons.length, 1)

  buttons[0].props.onClick()
  await settle()
  assert.deepEqual(reactivated, [7])
})

test('an error-disabled filter is marked as failing, without the inactivity notice', async () => {
  const { container } = await openFiltersPage([{ id: 9, name: 'Bike', state: 'DisabledError' }])

  assert.match(textOf(container), /filterDisabledError/)
  assert.doesNotMatch(textOf(container), /filterPausedInactive/)
  assert.equal(findAll(container, 'button').length, 0)
})
