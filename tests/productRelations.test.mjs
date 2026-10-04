import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildRelationsUrl,
  caseOfId,
  caseTitle,
  editionLanguageLabel,
  fetchProductRelations,
  isGameCaseProduct,
  localizedSubtitle,
  normalizeRelations,
} from '../utils/productRelations.ts'

test('buildRelationsUrl targets the relations resource of the product', () => {
  assert.equal(buildRelationsUrl('https://api', 'def-jam'), 'https://api/api/Product/def-jam/relations')
})

test('a missing endpoint (404) or a network error gives no relations instead of throwing', async () => {
  assert.equal(await fetchProductRelations('b', 'x', async () => {
    throw new Error('404')
  }), null)
  assert.equal(await fetchProductRelations('b', 'x', async () => null), null)
})

test('normalizeRelations tolerates missing sections', () => {
  const r = normalizeRelations({ localizedNames: { de: 'A' }, caseOf: { id: 'g', name: 'G' } })
  assert.deepEqual(r.casePages, [])
  assert.deepEqual(r.editions, [])
  assert.equal(r.caseOf.id, 'g')
  assert.equal(normalizeRelations({ caseOf: { name: 'no id' } }).caseOf, null)
})

test('case products are found by attribute (list or map) or by the name marker', () => {
  assert.equal(isGameCaseProduct({ attributes: [{ key: 'product_kind', value: 'game_case' }] }), true)
  assert.equal(isGameCaseProduct({ attributes: { product_kind: 'game_case' } }), true)
  assert.equal(isGameCaseProduct({ name: 'Def Jam – Empty case, no game', attributes: [] }), true)
  assert.equal(isGameCaseProduct({ name: 'Def Jam', attributes: [{ key: 'platform', value: 'ps2' }] }), false)
  assert.equal(isGameCaseProduct(null), false)
})

test('caseOfId reads the game page id from the attributes', () => {
  assert.equal(caseOfId({ attributes: { case_of: 'def-jam' } }), 'def-jam')
  assert.equal(caseOfId({ attributes: [] }), null)
})

test('localizedSubtitle shows the visitor language name only when it differs from the title', () => {
  assert.equal(localizedSubtitle({ de: 'Def Jam DE' }, 'de', 'Def Jam'), 'Def Jam DE')
  assert.equal(localizedSubtitle({ de: 'Def Jam' }, 'de', 'Def Jam'), null)
  assert.equal(localizedSubtitle({ de: 'x' }, 'en', 'Def Jam'), null)
  assert.equal(localizedSubtitle({ de: 'x' }, 'de-DE', 'T'), 'x')
  assert.equal(localizedSubtitle(null, 'de', 'T'), null)
})

test('caseTitle prefers the localized name', () => {
  assert.equal(caseTitle('Game – empty case, no game', { de: 'Spiel – Leerhülle' }, 'de'), 'Spiel – Leerhülle')
  assert.equal(caseTitle('Game', {}, 'de'), 'Game')
})

test('edition languages are labelled in their own language', () => {
  assert.equal(editionLanguageLabel('de'), 'Deutsch')
  assert.equal(editionLanguageLabel('it'), 'Italiano')
  assert.equal(editionLanguageLabel('pt'), 'PT')
  assert.equal(editionLanguageLabel(null), null)
})
