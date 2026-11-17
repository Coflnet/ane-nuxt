import assert from 'node:assert/strict'
import test from 'node:test'
import {
  attributeAlternatives, canAddValue, decodeAttributes, encodeAttributes, isAttributeSelected, stripAttributeTokens, titleVisibleKeys, toggleAttribute,
} from '../utils/attributeAlternatives.ts'

test('number and unit values are normalised to "<number> <unit>"', () => {
  assert.deepEqual(attributeAlternatives('storage', '256GB'), ['256 gb'])
  assert.deepEqual(attributeAlternatives('storage', '256 GB'), ['256 gb'])
  assert.deepEqual(attributeAlternatives('screen_size', '6,1 Zoll'), ['6.1 zoll'])
})

test('colours expand to their English and German spellings', () => {
  assert.deepEqual(attributeAlternatives('color', 'Blau'), ['blau', 'blue'])
  assert.deepEqual(attributeAlternatives('colour', 'white'), ['white', 'weiß', 'weiss'])
  assert.deepEqual(attributeAlternatives('color', 'Midnight'), ['midnight'])
  // colour synonyms only apply to colour keys
  assert.deepEqual(attributeAlternatives('edition', 'Gold'), ['gold'])
})

test('encodes AND across keys and OR across alternatives', () => {
  assert.equal(encodeAttributes({ storage: ['256GB'], color: ['Blau'] }), 'storage=256 gb;color=blau|blue')
  assert.equal(encodeAttributes({ storage: ['128GB', '256GB'] }), 'storage=128 gb|256 gb')
  assert.equal(encodeAttributes({}), '')
  assert.equal(encodeAttributes({ storage: [] }), '')
})

test('separators are stripped and limits enforced', () => {
  assert.equal(encodeAttributes({ model: ['a;b|c=d'] }), 'model=a b c d')
  const many = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`model${i}`, ['x']]))
  assert.equal(encodeAttributes(many).split(';').length, 8)
  const values = Array.from({ length: 20 }, (_, i) => `v${i}`)
  assert.equal(encodeAttributes({ model: values }).split('=')[1].split('|').length, 12)
  assert.equal(encodeAttributes({ model: ['x'.repeat(100)] }).split('=')[1].length, 60)
})

test('decode folds synonyms back into one chip and survives a round trip', () => {
  const wire = 'storage=256 gb;color=blau|blue'
  assert.deepEqual(decodeAttributes(wire), { storage: ['256 gb'], color: ['blau'] })
  assert.equal(encodeAttributes(decodeAttributes(wire)), wire)
  assert.deepEqual(decodeAttributes('broken;=x;color='), {})
  assert.deepEqual(decodeAttributes(undefined), {})
})

test('chip selection is multi-select per key and matches spellings', () => {
  let selection = toggleAttribute({}, 'color', 'Blue')
  assert.equal(isAttributeSelected(selection, 'color', 'blau'), true)
  selection = toggleAttribute(selection, 'color', 'Black')
  assert.deepEqual(selection, { color: ['Blue', 'Black'] })
  selection = toggleAttribute(selection, 'color', 'blau')
  assert.deepEqual(selection, { color: ['Black'] })
  assert.deepEqual(toggleAttribute(selection, 'color', 'schwarz'), {})
})

test('words that became chips are removed from the search term', () => {
  assert.equal(stripAttributeTokens('iPhone 15 Pro 256GB blau', { storage: ['256 GB'], color: ['Blue'] }), 'iPhone 15 Pro')
  assert.equal(stripAttributeTokens('iPhone 15 Pro 256 GB', { storage: ['256GB'] }), 'iPhone 15 Pro')
  // never strips inside other words, and keeps the query if nothing else would be left
  assert.equal(stripAttributeTokens('blauwal', { color: ['blau'] }), 'blauwal')
  assert.equal(stripAttributeTokens('blau', { color: ['blau'] }), 'blau')
})

test('only whitelisted title-visible keys are offered as chips', () => {
  assert.deepEqual(titleVisibleKeys(['battery', 'color', 'storage', 'os']), ['storage', 'color'])
})

test('canAddValue refuses a ninth key but still allows more values for a used key', () => {
  const keys = ['storage', 'ram', 'memory', 'size', 'color', 'model', 'edition', 'language']
  const full = Object.fromEntries(keys.map(key => [key, ['1']]))
  assert.equal(canAddValue(full, 'media_format', 'DVD'), false)
  assert.equal(canAddValue(full, 'storage', '2'), true)
  assert.equal(canAddValue(full, 'storage', '1'), true)
})

test('canAddValue refuses values that would exceed 12 alternatives', () => {
  const selection = { size: Array.from({ length: 12 }, (_, i) => `s${i}`) }
  assert.equal(canAddValue(selection, 'size', 'extra'), false)
  assert.equal(canAddValue(selection, 'size', 's3'), true)
  assert.equal(canAddValue({ color: ['Blau', 'Rot', 'Grün', 'Grau', 'Gelb'] }, 'color', 'Lila'), false)
  assert.equal(canAddValue({ color: ['Blau'] }, 'color', 'Rot'), true)
})

test('encoding never cuts a value partially: whole values that do not fit are dropped', () => {
  const wire = encodeAttributes({ color: ['Blau', 'Rot', 'Grün', 'Grau', 'Gelb', 'Lila'] })
  const alternatives = wire.replace('color=', '').split('|')
  assert.ok(alternatives.length <= 12)
  assert.ok(!wire.includes('lila'))
  assert.ok(alternatives.includes('gray') && alternatives.includes('grau'))
  const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
  const parts = encodeAttributes(Object.fromEntries(keys.map(key => [key, ['1']]))).split(';')
  assert.equal(parts.length, 8)
})
