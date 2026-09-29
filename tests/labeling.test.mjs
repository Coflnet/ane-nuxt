import assert from 'node:assert/strict'
import test from 'node:test'
import { answer, createQueueState, enqueue, needsRefill, remaining, rollback, undo, upcoming } from '../utils/labelingQueue.ts'
import { shortcutFor } from '../utils/labelingShortcuts.ts'
import { createLabelSender } from '../utils/labelingSender.ts'

const side = id => ({ platform: 'kleinanzeigen', listingId: id, imageUrl: `/${id}.png`, listingUrl: `/o/${id}` })
const pair = n => ({ pairId: `p${n}`, a: side(`a${n}`), b: side(`b${n}`) })
const pairs = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => pair(from + i))

test('first batch shows the first pair and queues the rest', () => {
  const s = enqueue(createQueueState(), pairs(1, 10))
  assert.equal(s.current.pairId, 'p1')
  assert.equal(s.queue.length, 9)
  assert.equal(upcoming(s).pairId, 'p2')
})

test('empty batch leaves the queue empty', () => {
  const s = enqueue(createQueueState(), [])
  assert.equal(s.current, null)
  assert.equal(remaining(s), 0)
  assert.equal(answer(s, 'unsure').answered, null)
})

test('refill is requested when three pairs are left, not before', () => {
  let s = enqueue(createQueueState(), pairs(1, 10))
  for (let i = 0; i < 6; i++) s = answer(s, 'different').state
  assert.equal(remaining(s), 4)
  assert.equal(needsRefill(s), false)
  s = answer(s, 'different').state
  assert.equal(remaining(s), 3)
  assert.equal(needsRefill(s), true)
})

test('answering moves on at once and records the answer', () => {
  const s0 = enqueue(createQueueState(), pairs(1, 3))
  const { state, answered } = answer(s0, 'same_item')
  assert.equal(answered.pair.pairId, 'p1')
  assert.equal(answered.label, 'same_item')
  assert.equal(state.current.pairId, 'p2')
})

test('answering the last pair leaves an empty screen and a later batch fills it', () => {
  let s = enqueue(createQueueState(), pairs(1, 1))
  s = answer(s, 'unsure').state
  assert.equal(s.current, null)
  s = enqueue(s, pairs(2, 3))
  assert.equal(s.current.pairId, 'p2')
})

test('a refill does not repeat pairs that are queued, on screen or just answered', () => {
  let s = enqueue(createQueueState(), pairs(1, 4))
  s = answer(s, 'different').state
  s = enqueue(s, pairs(1, 6))
  assert.deepEqual([s.current.pairId, ...s.queue.map(p => p.pairId)], ['p2', 'p3', 'p4', 'p5', 'p6'])
})

test('undo restores the last pair and pushes the visible one back to the front', () => {
  let s = enqueue(createQueueState(), pairs(1, 3))
  s = answer(s, 'same_item').state
  s = answer(s, 'different').state
  const r = undo(s)
  assert.equal(r.restored.pair.pairId, 'p2')
  assert.equal(r.restored.label, 'different')
  assert.equal(r.state.current.pairId, 'p2')
  assert.deepEqual(r.state.queue.map(p => p.pairId), ['p3'])
  const r2 = undo(r.state)
  assert.equal(r2.state.current.pairId, 'p1')
  assert.deepEqual(r2.state.queue.map(p => p.pairId), ['p2', 'p3'])
  assert.equal(undo(r2.state).restored, null)
})

test('undo from an empty screen brings the last pair back', () => {
  let s = enqueue(createQueueState(), pairs(1, 1))
  s = answer(s, 'unsure').state
  const r = undo(s)
  assert.equal(r.state.current.pairId, 'p1')
  assert.equal(r.state.queue.length, 0)
})

test('a failed save puts the pair back at the front of the queue', () => {
  let s = enqueue(createQueueState(), pairs(1, 3))
  s = answer(s, 'same_item').state
  const r = rollback(s, 'p1')
  assert.equal(r.restored, true)
  assert.deepEqual(r.state.queue.map(p => p.pairId), ['p1', 'p3'])
  assert.equal(r.state.current.pairId, 'p2')
  assert.equal(r.state.history.length, 0)
})

test('a failed save on the last pair shows it again', () => {
  let s = enqueue(createQueueState(), pairs(1, 1))
  s = answer(s, 'same_item').state
  assert.equal(rollback(s, 'p1').state.current.pairId, 'p1')
})

test('a failed save for a pair that was undone meanwhile changes nothing', () => {
  let s = enqueue(createQueueState(), pairs(1, 3))
  s = answer(s, 'same_item').state
  s = undo(s).state
  const r = rollback(s, 'p1')
  assert.equal(r.restored, false)
  assert.equal(r.state, s)
})

test('shortcuts map 1-4 to answers and Z or Backspace to undo', () => {
  const body = { tagName: 'BODY' }
  assert.deepEqual(shortcutFor({ key: '1', target: body }), { type: 'answer', label: 'same_item' })
  assert.deepEqual(shortcutFor({ key: '2', target: body }), { type: 'answer', label: 'same_model_other_variant' })
  assert.deepEqual(shortcutFor({ key: '3', target: body }), { type: 'answer', label: 'different' })
  assert.deepEqual(shortcutFor({ key: '4', target: body }), { type: 'answer', label: 'unsure' })
  assert.deepEqual(shortcutFor({ key: 'z', target: body }), { type: 'undo' })
  assert.deepEqual(shortcutFor({ key: 'Backspace', target: null }), { type: 'undo' })
  assert.equal(shortcutFor({ key: '5', target: body }), null)
})

test('shortcuts do not fire while typing, with modifiers or on key repeat', () => {
  assert.equal(shortcutFor({ key: '1', target: { tagName: 'INPUT' } }), null)
  assert.equal(shortcutFor({ key: 'Backspace', target: { tagName: 'textarea' } }), null)
  assert.equal(shortcutFor({ key: '2', target: { tagName: 'DIV', isContentEditable: true } }), null)
  assert.equal(shortcutFor({ key: 'z', ctrlKey: true, target: { tagName: 'BODY' } }), null)
  assert.equal(shortcutFor({ key: '1', metaKey: true }), null)
  assert.equal(shortcutFor({ key: '1', repeat: true }), null)
})

test('answers for the same pair are sent one after the other so the later one wins', async () => {
  const events = []
  const send = createLabelSender(async (id, label) => {
    events.push(`start ${id} ${label}`)
    await new Promise(r => setTimeout(r, label === 'same_item' ? 20 : 1))
    events.push(`end ${id} ${label}`)
  })
  await Promise.all([send('p1', 'same_item'), send('p1', 'different')])
  assert.deepEqual(events, ['start p1 same_item', 'end p1 same_item', 'start p1 different', 'end p1 different'])
})

test('a failing send rejects for the caller but does not block later sends', async () => {
  let calls = 0
  const send = createLabelSender(async () => {
    calls++
    if (calls === 1) throw new Error('boom')
  })
  await assert.rejects(send('p1', 'same_item'))
  await send('p1', 'different')
  assert.equal(calls, 2)
})

// Regression: vue-i18n treats "|" as the plural separator, so a placeholder with plain pipes
// showed only its second part ("sneakers").
test('labeling strings exist in both locales and contain no bare plural separator', async () => {
  const { readFile } = await import('node:fs/promises')
  const load = async n => JSON.parse(await readFile(new URL(`../locales/${n}.json`, import.meta.url), 'utf8'))
  const [en, de] = await Promise.all([load('en'), load('de')])
  const keys = Object.keys(en).filter(k => k.startsWith('labeling'))
  assert.ok(keys.length > 30)
  for (const k of keys) {
    assert.ok(k in de, `${k} missing in de`)
    assert.ok(!en[k].replaceAll('{\'|\'}', '').includes('|'), `${k} en has bare pipe`)
    assert.ok(!de[k].replaceAll('{\'|\'}', '').includes('|'), `${k} de has bare pipe`)
  }
})
