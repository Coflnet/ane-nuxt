import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bucketNumberBounds,
  buildSpecApiFilters,
  impliedOsFilter,
  impliedOsLabel,
  parseBucketNumber,
  removeImpliedPhrase,
  sortOsVersionBuckets,
  withRangeParams,
} from '../utils/specFilters.ts'

test('maps spec range URL params to API attribute filters', () => {
  assert.deepEqual(
    buildSpecApiFilters({
      attr_os_version_min: '15',
      attr_release_year_min: '2022',
      attr_release_year_max: '2024',
      attr_screen_size_min: '6,1',
      attr_screen_size_max: '6.7',
    }),
    ['os_version_min:15', 'release_year_min:2022', 'release_year_max:2024', 'screen_size_min:6.1', 'screen_size_max:6.7'],
  )
})

test('maps the os_version_supports param to the API', () => {
  assert.deepEqual(buildSpecApiFilters({ attr_os_version_supports: '15' }), ['os_version_supports:15'])
})

test('drops spec range params that are not positive numbers', () => {
  assert.deepEqual(buildSpecApiFilters({ attr_os_version_min: 'abc', attr_screen_size_min: '-1', attr_release_year_max: '' }), [])
  assert.deepEqual(buildSpecApiFilters({ attr_os: 'Android' }), [])
})

test('parses screen size bucket values', () => {
  assert.equal(parseBucketNumber('6.1"'), 6.1)
  assert.equal(parseBucketNumber('6,7 Zoll'), 6.7)
  assert.equal(parseBucketNumber('6'), 6)
  assert.equal(parseBucketNumber('120Hz'), null)
  assert.deepEqual(bucketNumberBounds([{ value: '6.1"' }, { value: '5.4"' }, { value: 'n/a' }]), { min: 5.4, max: 6.1 })
  assert.equal(bucketNumberBounds([{ value: 'x' }]), null)
})

test('orders OS versions numerically, newest first', () => {
  const sorted = sortOsVersionBuckets([{ value: '9' }, { value: '15' }, { value: '10' }, { value: 'beta' }])
  assert.deepEqual(sorted.map(b => b.value), ['15', '10', '9'])
})

test('range params are only set when narrower than the bounds', () => {
  const bounds = { min: 4, max: 7 }
  assert.deepEqual(withRangeParams({ q: 'phone' }, 'screen_size', { min: 6, max: 7 }, bounds), { q: 'phone', attr_screen_size_min: '6' })
  assert.deepEqual(withRangeParams({ q: 'phone', attr_screen_size_min: '6' }, 'screen_size', { min: 4, max: 7 }, bounds), { q: 'phone' })
})

test('reads the OS filter the backend implied from the query text', () => {
  const exact = impliedOsFilter({ os: 'Android', os_version_supports: '15' })
  assert.deepEqual(exact, { os: 'Android', version: '15', mode: 'supports' })
  assert.equal(impliedOsLabel(exact), 'Android 15')
  const newer = impliedOsFilter({ os: 'iOS', os_version_min: '18' })
  assert.equal(impliedOsLabel(newer), 'iOS 18+')
  assert.equal(impliedOsLabel(impliedOsFilter({ os: 'Android' })), 'Android')
  assert.equal(impliedOsFilter(null), null)
})

test('removing the implied filter strips exactly its phrase from the query', () => {
  assert.equal(removeImpliedPhrase('samsung android 15 128gb', 'android 15'), 'samsung 128gb')
  assert.equal(removeImpliedPhrase('Android 15', 'android 15'), '')
  assert.equal(removeImpliedPhrase('nokia', 'android'), 'nokia')
  assert.equal(removeImpliedPhrase('nokia', null), 'nokia')
})
