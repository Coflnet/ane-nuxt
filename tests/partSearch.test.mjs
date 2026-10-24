import assert from 'node:assert/strict'
import test from 'node:test'
import { partFormFromQuery, partSearchParams } from '../utils/partSearch.ts'

test('a plain description allows the API to detect bearings and other part classes', () => {
  const query = partSearchParams(partFormFromQuery({ q: 'Kugellager 6203-2RS' }))
  assert.equal(query.q, 'Kugellager 6203-2RS')
  assert.ok(!('class' in query))
  assert.equal(query.tolerance, '0.02')
  assert.equal(query.toleranceMm, '0.2')
})

test('a shared fragment search preserves its range inputs and excludes an old full count', () => {
  const query = partSearchParams(partFormFromQuery({ class: 'gear', teeth: '42', teeth_observed: '8', arc_degrees: '120', boreMm: '8,5', mode: 'fragment' }))
  assert.equal(query.teeth_observed, '8')
  assert.equal(query.arc_degrees, '120')
  assert.equal(query.boreMm, '8.5')
  assert.ok(!('teeth' in query))
  assert.deepEqual(partSearchParams(partFormFromQuery(query)), query)
})

test('class changes remove hidden gear criteria and keep bearing measurements', () => {
  const query = partSearchParams(partFormFromQuery({ class: 'bearing', part_key: '6203-2RS', teeth: '42', module: '1', boreMm: '8', innerDiameterMm: '17', mode: 'fragment', teeth_observed: '8', arc_degrees: '120' }))
  assert.equal(query.part_key, '6203-2RS')
  assert.equal(query.innerDiameterMm, '17')
  for (const field of ['teeth', 'module', 'boreMm', 'teeth_observed', 'arc_degrees', 'mode']) assert.ok(!(field in query))
})

test('unknown URL fields and photos never enter the shared search criteria', () => {
  const query = partSearchParams(partFormFromQuery({ class: 'unknown', q: '  gear 42 teeth  ', imageBase64: 'private-photo', apiKey: 'private-credential', token: 'private-token' }))
  assert.equal(query.q, 'gear 42 teeth')
  assert.ok(!JSON.stringify(query).includes('private'))
  assert.ok(!('class' in query))
})

test('Vue numeric inputs serialize numbers without losing a search or fragment measurement', () => {
  const form = partFormFromQuery({ class: 'gear' })
  form.teeth = 42
  form.boreMm = 8.5
  assert.equal(partSearchParams(form).teeth, '42')
  assert.equal(partSearchParams(form).boreMm, '8.5')
  form.mode = 'fragment'
  form.teeth_observed = 8
  form.arc_degrees = 120
  assert.equal(partSearchParams(form).teeth_observed, '8')
  assert.equal(partSearchParams(form).arc_degrees, '120')
})


test('generic parts retain the displayed bore measurement while bearing searches omit it', () => {
  const generic = partSearchParams(partFormFromQuery({ class: 'generic', partNumber: 'SYNTHETIC-1', boreMm: '8.5' }))
  assert.equal(generic.boreMm, '8.5')
  const bearing = partSearchParams(partFormFromQuery({ class: 'bearing', part_key: '6203-2RS', boreMm: '8.5' }))
  assert.ok(!('boreMm' in bearing))
})
