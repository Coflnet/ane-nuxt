import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from 'vue/compiler-sfc'
import { computed, effectScope, nextTick, reactive, ref, shallowRef, watch } from 'vue'

const proof = { model_id: 'synthetic/model', model_revision: 'a'.repeat(40), model_sha256: 'b'.repeat(64), projection_id: null, embedding_sha256: 'c'.repeat(64) }
const previous = JSON.stringify({ threshold: 0.7, emb: [1, 0], thumb: 'previous', thumbMime: 'image/jpeg' })
const file = { name: 'replacement.png', base64: 'replacement' }

async function createFilter(value = previous, plan = 'collector', styleMode = false) {
  const { descriptor } = parse(await readFile(new URL('../components/filters/VisualSimilarityFilter.vue', import.meta.url), 'utf8'))
  const code = stripTypeScriptTypes(compileScript(descriptor, { id: 'visual-upload-test' }).content)
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/g, (_, names) => `const {${names.replace(/\bas\b/g, ':')}} = __vue`)
    .replace('export default', 'return')
  const pending = [], emitted = [], events = [], cleanup = [], draws = []
  const props = reactive({ modelValue: value, styleMode })
  const user = reactive({ currentPlan: { product: plan }, token: 'local-test-token', getSubscriptionEndDate: async () => {} })
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
  class UploadedFile {
    constructor(parts, name, options) {
      this.base64 = Buffer.from(parts[0]).toString('base64')
      this.name = name
      this.type = options.type
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
    return { getContext: () => ({ drawImage: (value, ...coordinates) => {
      draws.push(coordinates)
      image = value
    } }), toDataURL: () => `data:image/jpeg;base64,${image.value.split(',')[1]}` }
  } }
  const component = new Function('__vue', 'ref', 'shallowRef', 'computed', 'watch', 'onBeforeUnmount', 'onMounted', 'useUserStore', 'useLocalePath', 'useI18n', '$fetch', 'FileReader', 'Image', 'document', 'File', code)(
    await import('vue'), ref, shallowRef, computed, watch, fn => cleanup.push(fn), fn => fn(), () => user, () => path => path, () => ({ t: key => key }),
    (url, options) => new Promise((resolve, reject) => pending.push({ url, options, resolve, reject })), Reader, Photo, document, UploadedFile,
  )
  const effects = effectScope()
  const state = effects.run(() => component.setup(props, { expose() {}, emit: (event, payload) => {
    events.push([event, payload])
    if (event !== 'update:modelValue') return
    emitted.push(payload)
    props.modelValue = payload
  } }))
  return { state, props, pending, emitted, events, draws,
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
  field.pending[1].resolve({ emb: [0, 1], provenance: proof })
  await retry
  assert.deepEqual(JSON.parse(field.props.modelValue), { threshold: 0.7, emb: [0, 1], thumb: 'replacement', thumbMime: 'image/jpeg', provenance: proof })
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
  field.pending[0].resolve({ embedding: [0, 1], provenance: proof })
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
  field.pending[0].resolve({ emb: [0, 1], provenance: proof })
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
  field.pending[0].resolve({ embedding: [0, 1], provenance: proof })
  await attempt
  assert.deepEqual(JSON.parse(field.props.modelValue), { threshold: 0.85, emb: [0, 1], thumb: 'replacement', thumbMime: 'image/jpeg', provenance: proof })
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
  field.pending[0].resolve({ emb: [0, 1], provenance: proof })
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

test('saved checkpoint proof survives loading, threshold edits and serialization', async () => {
  const field = await createFilter(JSON.stringify({ ...JSON.parse(previous), provenance: proof }))
  field.state.threshold.value = 0.82
  await nextTick()
  assert.deepEqual(JSON.parse(field.props.modelValue).provenance, proof)
  field.stop()
})

test('legacy saved thumbnail can be refreshed without uploading the file again', async () => {
  const field = await createFilter()
  field.state.refreshReference()
  await settle()
  assert.equal(field.pending[0].options.body.imageBase64, 'previous')
  field.pending[0].resolve({ emb: [0, 1], provenance: proof })
  await settle()
  assert.deepEqual(JSON.parse(field.props.modelValue).provenance, proof)
  assert.equal(JSON.parse(field.props.modelValue).thumb, 'previous')
  field.stop()
})

test('a backend response without checkpoint proof cannot replace an active reference', async () => {
  const field = await createFilter()
  const attempt = field.select()
  await settle()
  field.pending[0].resolve({ emb: [0, 1] })
  await attempt
  assert.equal(field.props.modelValue, previous)
  assert.equal(field.state.error.value, 'visualSimilarity.refreshFailed')
  assert.equal(field.state.pendingFile.value.name, 'replacement.png')
  field.stop()
})

test('style upload sends the mode, suggests an editable canonical type and automatically becomes ready', async () => {
  const field = await createFilter('', 'collector', true)
  const attempt = field.select()
  await settle()
  assert.equal(field.pending[0].options.body.mode, 'style')
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], false)
  field.pending[0].resolve({ emb: [1, 0], provenance: proof, suggestedGarmentType: 'jacket' })
  await attempt
  await nextTick()
  assert.equal(field.state.garmentType.value, 'jacket')
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], true)
  field.state.size.value = ' M '
  await nextTick()
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], true)
  assert.deepEqual(JSON.parse(field.props.modelValue), { mode: 'style', garmentType: 'jacket', size: 'M', threshold: 0.8, emb: [1, 0], thumb: 'replacement', thumbMime: 'image/jpeg', provenance: proof })
  field.state.garmentType.value = 'coat'
  await nextTick()
  assert.equal(JSON.parse(field.props.modelValue).garmentType, 'coat')
  field.stop()
})

test('style crop embeds exactly the selected rectangle and remains unready after failure', async () => {
  const field = await createFilter('', 'collector', true)
  const attempt = field.select()
  await settle()
  field.pending[0].resolve({ emb: [1, 0], provenance: proof })
  await attempt
  field.state.garmentType.value = 'dress'
  await nextTick()
  field.state.crop.value = { x: 0.25, y: 0, w: 0.5, h: 1 }
  field.state.cropPending.value = true
  field.state.applyCrop()
  await settle()
  assert.deepEqual(field.draws.at(-1), [128, 0, 256, 256, 0, 0, 256, 256])
  field.pending[1].reject(new Error('Temporary error'))
  await settle()
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], false)
  assert.equal(JSON.parse(field.props.modelValue).thumb, 'replacement')
  assert.equal(field.state.sourceFile.value.name, file.name)
  field.stop()
})

test('unknown suggested types cannot make a style reference ready', async () => {
  const field = await createFilter('', 'collector', true)
  const attempt = field.select()
  await settle()
  field.pending[0].resolve({ emb: [1, 0], provenance: proof, suggestedGarmentType: 'unknown' })
  await attempt
  assert.equal(field.state.garmentType.value, '')
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], false)
  field.stop()
})

test('loaded style preferences survive parent updates and threshold edits, bounded to four', async () => {
  const example = { emb: [0, 1], provenance: proof, sourceListingId: 'source-id', sourcePlatform: 'Ebay', sourceImageUrl: 'https://images.example.test/garment.jpg', positive: true }
  const raw = { ...JSON.parse(previous), mode: 'style', garmentType: 'jacket', provenance: proof, examples: Array.from({ length: 5 }, () => example) }
  const field = await createFilter(JSON.stringify(raw), 'collector', true)
  field.state.threshold.value = 0.88
  await nextTick()
  assert.equal(JSON.parse(field.props.modelValue).examples.length, 4)
  field.props.modelValue = JSON.stringify({ ...JSON.parse(field.props.modelValue), examples: [{ ...example, positive: false }] })
  await nextTick()
  field.state.size.value = 'L'
  await nextTick()
  assert.deepEqual(JSON.parse(field.props.modelValue).examples, [{ ...example, positive: false }])
  field.stop()
})

test('a new reference image clears previous style preferences', async () => {
  const raw = { ...JSON.parse(previous), mode: 'style', garmentType: 'jacket', provenance: proof, examples: [{ emb: [0, 1], provenance: proof, sourceListingId: 'source-id', sourcePlatform: 'Ebay', sourceImageUrl: 'https://images.example.test/garment.jpg', positive: false }] }
  const field = await createFilter(JSON.stringify(raw), 'collector', true)
  const attempt = field.select()
  await settle()
  field.pending[0].resolve({ emb: [1, 0], provenance: proof })
  await attempt
  assert.equal(JSON.parse(field.props.modelValue).examples, undefined)
  field.state.clear()
  assert.equal(field.state.examples.value.length, 0)
  field.stop()
})

test('saved style reference is ready on reload and its type stays editable', async () => {
  const raw = { ...JSON.parse(previous), mode: 'style', garmentType: 'jacket', provenance: proof }
  const field = await createFilter(JSON.stringify(raw), 'collector', true)
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], true)
  field.state.garmentType.value = ''
  await nextTick()
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], false)
  field.state.garmentType.value = 'coat'
  await nextTick()
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], true)
  assert.equal(JSON.parse(field.props.modelValue).garmentType, 'coat')
  field.stop()
})

test('replacement style photos get their own garment suggestion while retries keep manual edits', async () => {
  const raw = { ...JSON.parse(previous), mode: 'style', garmentType: 'jacket', provenance: proof }
  const field = await createFilter(JSON.stringify(raw), 'collector', true)
  let attempt = field.select()
  await settle()
  field.pending[0].resolve({ emb: [0, 1], provenance: proof, suggestedGarmentType: 'dress' })
  await attempt
  await nextTick()
  assert.equal(field.state.garmentType.value, 'dress')
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], true)
  attempt = field.select()
  await settle()
  field.pending[1].resolve({ emb: [1, 0], provenance: proof })
  await attempt
  await nextTick()
  assert.equal(field.state.garmentType.value, '')
  assert.equal(field.events.filter(([event]) => event === 'ready').at(-1)[1], false)
  field.state.garmentType.value = 'coat'
  attempt = field.state.prepareImage(file)
  await settle()
  field.pending[2].resolve({ emb: [1, 0], provenance: proof, suggestedGarmentType: 'dress' })
  await attempt
  assert.equal(field.state.garmentType.value, 'coat')
  field.stop()
})
