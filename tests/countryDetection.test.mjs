import assert from 'node:assert/strict'
import test from 'node:test'
import { detectCountry, parseAcceptLanguage, regionFromLanguage, countryFlag, normalizeCountryCode } from '../utils/countryDetection.ts'

test('a stored choice wins over header and browser language', () => {
  assert.equal(detectCountry({ stored: 'nl', header: 'FR', languages: ['de-AT'] }), 'NL')
})

test('the CF-IPCountry header wins over the browser language', () => {
  assert.equal(detectCountry({ header: 'ch', languages: ['de-AT'] }), 'CH')
})

test('pseudo header values (XX, T1) are ignored', () => {
  assert.equal(detectCountry({ header: 'XX', languages: ['de-AT'] }), 'AT')
  assert.equal(detectCountry({ header: 'T1', languages: ['fr-BE'] }), 'BE')
})

test('the browser language region is used, de-AT gives AT', () => {
  assert.equal(detectCountry({ languages: ['de-AT', 'de'] }), 'AT')
  assert.equal(detectCountry({ languages: ['de', 'en-GB'] }), 'GB')
})

test('falls back to DE', () => {
  assert.equal(detectCountry({}), 'DE')
  assert.equal(detectCountry({ stored: 'xyz', header: '', languages: ['de', 'en'] }), 'DE')
})

test('regionFromLanguage handles separators, scripts and missing regions', () => {
  assert.equal(regionFromLanguage('en_gb'), 'GB')
  assert.equal(regionFromLanguage('zh-Hant-TW'), 'TW')
  assert.equal(regionFromLanguage('de'), null)
  assert.equal(regionFromLanguage(undefined), null)
})

test('parseAcceptLanguage orders by quality and drops wildcards', () => {
  assert.deepEqual(parseAcceptLanguage('en;q=0.5, de-AT, *;q=0.1, fr;q=0.8'), ['de-AT', 'fr', 'en'])
  assert.deepEqual(parseAcceptLanguage(undefined), [])
})

test('countryFlag and normalizeCountryCode', () => {
  assert.equal(countryFlag('de'), '\u{1F1E9}\u{1F1EA}')
  assert.equal(countryFlag('x1'), '')
  assert.equal(normalizeCountryCode(' at '), 'AT')
  assert.equal(normalizeCountryCode(5), null)
})
