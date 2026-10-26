import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { ref } from 'vue'
import { partFormFromQuery } from '../utils/partSearch.ts'

const source = await readFile(new URL('../pages/parts.vue', import.meta.url), 'utf8')
const analyze = stripTypeScriptTypes(source.match(/async function analyzePhoto\([\s\S]*?\n\}/)[0])

function photoState(query = {}) {
  let resolve, reject
  const response = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  const state = {
    form: partFormFromQuery(query), photoRequest: undefined, apiBase: '', t: key => key,
    photoLoading: ref(false), photoError: ref(''), photoEstimate: ref(null),
    photoBase64: ref('private-photo'), photoDirty: ref(true), $fetch: () => response,
  }
  return { state, resolve, reject, run: () => new Function('state', `with (state) { ${analyze}; return analyzePhoto() }`)(state) }
}

test('photo count autofills editable defaults and keeps dimensions entered during analysis', async () => {
  const { state, resolve, run } = photoState()
  const pending = run()
  state.form.boreMm = '8.5'
  state.form.outerDiameterMm = '44'
  resolve({ teeth: 42, verified: false, confidence: 0.5 })
  await pending
  assert.equal(state.form.class, 'gear')
  assert.equal(state.form.teeth, '42')
  assert.equal(state.form.boreMm, '8.5')
  assert.equal(state.form.outerDiameterMm, '44')
  assert.equal(state.photoLoading.value, false)
})

test('photo completion keeps a tooth count corrected while analysis was pending', async () => {
  const { state, resolve, run } = photoState({ class: 'gear', teeth: '40' })
  const pending = run()
  state.form.teeth = '43'
  resolve({ teeth: 42, verified: false, confidence: 0.5 })
  await pending
  assert.equal(state.form.teeth, '43')
  assert.equal(state.photoEstimate.value.teeth, 42, 'estimate remains available for manual comparison')
  assert.equal(state.photoLoading.value, false)
})

test('fragment analysis keeps both manual measurements when either changes', async () => {
  for (const field of ['teeth_observed', 'arc_degrees']) {
    const { state, resolve, run } = photoState({ class: 'gear', mode: 'fragment', teeth_observed: '8', arc_degrees: '120' })
    const pending = run()
    state.form[field] = field === 'teeth_observed' ? '9' : '130'
    const manual = { ...state.form }
    resolve({ teethObserved: 10, arcDegrees: 150, teethEstimatedFromFragment: 24, verified: false, confidence: 0.5 })
    await pending
    assert.deepEqual(state.form, manual)
  }
})

test('unchanged fragment measurements receive the editable estimate', async () => {
  const { state, resolve, run } = photoState({ class: 'gear', mode: 'fragment' })
  const pending = run()
  resolve({ teethObserved: 10, arcDegrees: 150.12, verified: false, confidence: 0.5 })
  await pending
  assert.equal(state.form.teeth_observed, '10')
  assert.equal(state.form.arc_degrees, '150.1')
})

test('changing class or mode prevents an old photo response from changing the new search', async () => {
  for (const [field, value] of [['class', 'bearing'], ['mode', 'fragment']]) {
    const { state, resolve, run } = photoState()
    const pending = run()
    state.form[field] = value
    resolve({ teeth: 42, verified: false, confidence: 0.5 })
    await pending
    assert.equal(state.form[field], value)
    assert.equal(state.form.teeth, '')
  }
})

test('busy photo analysis preserves the image and measurements for retry', async () => {
  const { state, reject, run } = photoState({ class: 'gear', teeth: '43', boreMm: '8.5' })
  const pending = run()
  reject({ statusCode: 429 })
  await pending
  assert.equal(state.photoError.value, 'parts.photoBusy')
  assert.equal(state.photoBase64.value, 'private-photo')
  assert.equal(state.form.teeth, '43')
  assert.equal(state.form.boreMm, '8.5')
  assert.equal(state.photoLoading.value, false)
})
