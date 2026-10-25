import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import { computed, effectScope, nextTick, reactive, ref, shallowRef, watch } from 'vue'

const previous = JSON.stringify({ threshold: 0.7, emb: [1, 0], thumb: 'previous', thumbMime: 'image/jpeg' })
const file = { name: 'replacement.png', base64: 'replacement' }

async function createFilter(value = previous, plan = 'collector') {
  const { descriptor } = parse(await readFile(new URL('../components/filters/VisualSimilarityFilter.vue', import.meta.url), 'utf8'))
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'visual-upload-test' }).content)
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g, (_, names) => `const {${names.replace(/\bas\b/g, ':')}} = __vue`)
    .replace('export default', 'return')
  const pending = [], emitted = [], cleanup = []
  const props = reactive({ modelValue: value })
  const user = reactive({ currentPlan: { product: plan }, token: 'local-test-token' })
  class Reader {
    readAsDataURL(input) {
      queueMicrotask(() => {
        if (input.unreadable) this.onerror()
        else {
          this.result = `data:image/png;base64,${input.base64}`
          this.onload()
        }
      })
    }
  }
  class Photo {
    width = 512
    height = 256
    set src(value) {
      this.value = value
      queueMicrotask(() => this.onload())
    }
  }
  const document = { createElement() {
    let image
    return { getContext: () => ({ drawImage: (value) => {
      image = value
    } }), toDataURL: () => `data:image/jpeg;base64,${image.value.split(',')[1]}` }
  } }
  const component = new Function('__vue', 'ref', 'shallowRef', 'computed', 'watch', 'onBeforeUnmount', 'useUserStore', 'useI18n', '$fetch', 'FileReader', 'Image', 'document', code)(
    await import('vue'), ref, shallowRef, computed, watch, fn => cleanup.push(fn), () => user, () => ({ t: key => key }),
    (url, options) => new Promise((resolve, reject) => pending.push({ url, options, resolve, reject })), Reader, Photo, document,
  )
  const effects = effectScope()
  const state = effects.run(() => component.setup(props, { expose() {}, emit: (_, payload) => {
    emitted.push(payload)
    props.modelValue = payload
  } }))
  return { state, props, pending, emitted,
    select: (input = file) => state.onFileSelected({ target: { files: [input], value: input.name } }),
    stop: () => {
      cleanup.forEach(fn => fn())
      effects.stop()
    },
  }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

test('failed image replacement preserves the active preview, embedding and serialized filter, with retry', async () => {
  const field = await createFilter()
  const attempt = field.select()
  await settle()
  assert.equal(field.state.thumbBase64.value, 'previous', 'the old reference remains active while its replacement prepares')
  assert.equal(field.pending[0].options.body.imageBase64, 'replacement')
  field.pending[0].reject({ data: { error: 'Temporarily unavailable' } })
  await attempt
  assert.equal(field.state.error.value, 'Temporarily unavailable')
  assert.equal(field.props.modelValue, previous)
  assert.deepEqual(field.state.embedding.value, [1, 0])
  assert.equal(field.state.thumbDataUrl.value, 'data:image/jpeg;base64,previous')
  assert.equal(field.emitted.length, 0)
  const retry = field.state.prepareImage(field.state.pendingFile.value)
  await settle()
  field.pending[1].resolve({ emb: [0, 1] })
  await retry
  assert.deepEqual(JSON.parse(field.props.modelValue), { threshold: 0.7, emb: [0, 1], thumb: 'replacement', thumbMime: 'image/jpeg' })
  assert.equal(field.state.error.value, '')
  assert.equal(field.state.pendingFile.value, null)
  field.stop()
})

test('clear cancels an in-flight replacement and ignores a late server response', async () => {
  const field = await createFilter()
  const attempt = field.select()
  await settle()
  field.state.clear()
  assert.equal(field.pending[0].options.signal?.aborted, true)
  field.pending[0].resolve({ embedding: [0, 1] })
  await attempt
  assert.equal(field.props.modelValue, '')
  assert.equal(field.state.thumbDataUrl.value, '')
  assert.deepEqual(field.state.embedding.value, [])
  assert.deepEqual(field.emitted, [''])
  assert.equal(field.state.preparing.value, false)
  field.stop()
})

test('an external reset clears the preview and prevents an obsolete upload from restoring it', async () => {
  const field = await createFilter()
  const attempt = field.select()
  await settle()
  field.props.modelValue = ''
  await nextTick()
  field.pending[0].resolve({ emb: [0, 1] })
  await attempt
  assert.equal(field.state.thumbDataUrl.value, '')
  assert.deepEqual(field.state.embedding.value, [])
  assert.equal(field.props.modelValue, '')
  assert.equal(field.emitted.length, 0)
  field.stop()
})

test('loaded image-free references never display a previous reference thumbnail', async () => {
  const field = await createFilter()
  field.props.modelValue = JSON.stringify({ threshold: 0.8, emb: [0, 1], thumb: '', thumbMime: 'image/jpeg' })
  await nextTick()
  assert.equal(field.state.thumbDataUrl.value, '')
  assert.deepEqual(field.state.embedding.value, [0, 1])
  field.stop()
})

test('threshold changes while uploading keep the active filter and do not cancel its replacement', async () => {
  const field = await createFilter()
  const attempt = field.select()
  await settle()
  field.state.threshold.value = 0.85
  await nextTick()
  assert.equal(JSON.parse(field.props.modelValue).thumb, 'previous')
  field.pending[0].resolve({ embedding: [0, 1] })
  await attempt
  assert.deepEqual(JSON.parse(field.props.modelValue), { threshold: 0.85, emb: [0, 1], thumb: 'replacement', thumbMime: 'image/jpeg' })
  field.stop()
})

test('a local image decoding failure preserves the active filter and permits another upload', async () => {
  const field = await createFilter()
  await field.select({ ...file, unreadable: true })
  assert.equal(field.pending.length, 0)
  assert.equal(field.props.modelValue, previous)
  assert.equal(field.state.thumbBase64.value, 'previous')
  assert.equal(field.state.preparing.value, false)
  assert.match(field.state.error.value, /FileReader/)
  field.stop()
})

test('unmount aborts preparation and emits no late filter update', async () => {
  const field = await createFilter()
  const attempt = field.select()
  await settle()
  field.stop()
  field.pending[0].resolve({ emb: [0, 1] })
  await attempt
  assert.equal(field.emitted.length, 0)
  assert.equal(field.pending[0].options.signal?.aborted, true)
})

test('the existing paid-plan gate sends no preparation request for an ineligible user', async () => {
  const field = await createFilter(previous, 'free')
  await field.select()
  assert.equal(field.pending.length, 0)
  assert.equal(field.props.modelValue, previous)
  assert.equal(field.state.error.value, 'visualSimilarity.collectorRequired')
  field.stop()
})
