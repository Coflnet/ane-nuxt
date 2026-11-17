import assert from 'node:assert/strict'
import test from 'node:test'
import { hasStoreCoverage, showIndividualOffersToggle, showPartsSuggestion, showStoreReference } from '../utils/searchSpecialVisibility.ts'
import { partHintChips, partsFinderQuery, partsSuggestionDismissKey } from '../utils/partsSuggestion.ts'
import { partFormFromQuery } from '../utils/partSearch.ts'

const base = { toggleActive: false, isPartQuery: false, hasSearched: true, totalResults: 500, pageSize: 20 }

test('individual-offers toggle hides for ordinary searches with a full page of results', () => {
  assert.equal(showIndividualOffersToggle(base), false)
  assert.equal(showIndividualOffersToggle({ ...base, hasSearched: false, totalResults: 0 }), false)
})

test('individual-offers toggle shows when active, for part queries or when results are thin', () => {
  assert.equal(showIndividualOffersToggle({ ...base, toggleActive: true }), true)
  assert.equal(showIndividualOffersToggle({ ...base, isPartQuery: true }), true)
  assert.equal(showIndividualOffersToggle({ ...base, totalResults: 19 }), true)
  assert.equal(showIndividualOffersToggle({ ...base, totalResults: 0 }), true)
  assert.equal(showIndividualOffersToggle({ ...base, totalResults: 20 }), false)
})

test('store reference shows only with Lefeld/GoTools coverage or a selected store', () => {
  assert.equal(showStoreReference([], ''), false)
  assert.equal(showStoreReference([{ value: 'Lefeld', count: 0 }, { value: 'Other', count: 9 }], ''), false)
  assert.equal(showStoreReference([{ value: 'GoTools', count: 3 }], ''), true)
  assert.equal(showStoreReference([], 'Lefeld'), true)
  assert.equal(hasStoreCoverage([{ value: null, count: 4 }]), false)
})

test('parts suggestion shows only for undismissed part queries', () => {
  assert.equal(showPartsSuggestion(true, false), true)
  assert.equal(showPartsSuggestion(true, true), false)
  assert.equal(showPartsSuggestion(false, false), false)
  assert.equal(showPartsSuggestion(undefined, false), false)
})

test('parts finder query uses the keys partFormFromQuery reads and round-trips the hints', () => {
  const hints = { partClass: 'Gear', teeth: 42, boreMm: 8, outerDiameterMm: 44.5, module: 1, partNumber: ' 123-A ', machine: 'Husqvarna 136', position: 'front', rimType: null }
  const query = partsFinderQuery('  zahnrad 42 zähne  ', hints)
  assert.deepEqual(query, { q: 'zahnrad 42 zähne', class: 'gear', teeth: '42', boreMm: '8', outerDiameterMm: '44.5', module: '1', partNumber: '123-A', machine: 'Husqvarna 136' })
  const form = partFormFromQuery(query)
  assert.equal(form.class, 'gear')
  assert.equal(form.teeth, '42')
  assert.equal(form.boreMm, '8')
  assert.equal(form.partNumber, '123-A')
  assert.equal(form.q, 'zahnrad 42 zähne')
})

test('parts finder query maps partKey to part_key and drops unknown classes and empty values', () => {
  assert.deepEqual(partsFinderQuery('6203 lager', { partClass: 'flux-capacitor', partKey: '6203-2RS', innerDiameterMm: 17, widthMm: 0, teeth: null }),
    { q: '6203 lager', part_key: '6203-2RS', innerDiameterMm: '17' })
  assert.deepEqual(partsFinderQuery('', null), {})
})

test('hint chips list the carried-over details in a stable order with i18n keys', () => {
  assert.deepEqual(partHintChips({ boreMm: 8, partClass: 'gear', teeth: 42, position: 'rear' }), [
    { key: 'parts.classes.gear', value: 'gear' },
    { key: 'searchMore.chips.teeth', value: '42' },
    { key: 'searchMore.chips.boreMm', value: '8' },
  ])
  assert.deepEqual(partHintChips(undefined), [])
})

test('dismissal key is per normalised query', () => {
  assert.equal(partsSuggestionDismissKey(' Zahnrad  42 '), partsSuggestionDismissKey('zahnrad 42'))
  assert.notEqual(partsSuggestionDismissKey('zahnrad 42'), partsSuggestionDismissKey('zahnrad 43'))
})

test('parts finder moved from the main navigation to "More ways to search" and the footer', async () => {
  const { readFile } = await import('node:fs/promises')
  const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  for (const nav of ['components/appHeader/NavButtons.vue', 'components/appHeader/NavButtonsMobile.vue']) {
    assert.doesNotMatch(await read(nav), /\/parts/, `${nav} no longer links the parts finder`)
  }
  assert.match(await read('components/appFooter.vue'), /localePath\('\/parts'\)/)
  const search = await read('pages/search.vue')
  const details = search.match(/<details[\s\S]*?data-testid="more-ways-to-search"[\s\S]*?<\/details>/)?.[0]
  assert.ok(details, 'collapsed More ways to search block exists')
  assert.match(details, /<summary/)
  assert.match(details, /localePath\('\/parts'\)[\s\S]*data-testid="more-ways-parts"[\s\S]*\$t\('parts\.nav'\)/)
  assert.match(details, /query: \{ entry: 'photo' \}[\s\S]*data-testid="more-ways-photo"/)
  assert.ok(search.indexOf('data-testid="more-ways-to-search"') < search.indexOf('<!-- Results Section'), 'shown in the hero before any search runs')
})

test('searchMore locale keys exist in en and de', async () => {
  const { readFile } = await import('node:fs/promises')
  const keys = locale => readFile(new URL(`../locales/${locale}.json`, import.meta.url), 'utf8').then(text => JSON.parse(text).searchMore)
  const [en, de] = await Promise.all([keys('en'), keys('de')])
  const flat = obj => Object.entries(obj).flatMap(([k, v]) => typeof v === 'object' ? flat(v).map(sub => `${k}.${sub}`) : [k]).sort()
  assert.deepEqual(flat(de), flat(en))
  for (const chip of partHintChips({ teeth: 1, boreMm: 1, outerDiameterMm: 1, innerDiameterMm: 1, widthMm: 1, module: 1, partNumber: 'x', partKey: 'x', machine: 'x' })) {
    assert.ok(en.chips[chip.key.replace('searchMore.chips.', '')], chip.key)
  }
})
