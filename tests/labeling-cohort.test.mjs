import assert from 'node:assert/strict'
import test from 'node:test'
import { freezeCohort, parseCohortQuery } from '../utils/labelingCohort.ts'

const fingerprint = 'a'.repeat(64)
const query = `?cohortMode=enforce&from=2026-11-13T00:00:00Z&until=2026-11-14T00:00:00Z&policyFingerprint=${fingerprint}`
const pair = id => ({ pairId: id, captureCommitment: 'b'.repeat(64), cohortPolicyFingerprint: fingerprint, a: {}, b: {} })

test('normal queue remains default and partial or ambiguous links fail closed', () => {
  assert.equal(parseCohortQuery(''), null)
  assert.equal(parseCohortQuery(query.replace(/&policyFingerprint=.*/, '')).policyFingerprint, '')
  assert.throws(() => parseCohortQuery('?cohortMode=enforce'))
  assert.throws(() => parseCohortQuery(query + '&cohortMode=shadow_admitted'))
  assert.throws(() => parseCohortQuery(query.replace('enforce', 'shadow')))
  assert.equal(parseCohortQuery(query.replace('enforce', 'shadow_admitted')).cohortMode, 'shadow_admitted')
})

test('receipt freezes exact opaque pair membership and capture commitments before answers', () => {
  const batch = [pair('p1'), pair('p2')]
  const receipt = freezeCohort(parseCohortQuery(query), batch)
  batch[0].pairId = 'changed'
  assert.deepEqual(receipt.pairs.map(p => p.pairId), ['p1', 'p2'])
  assert.throws(() => receipt.pairs.push(pair('p3')))
  assert.throws(() => { receipt.selector.from = 'changed' })
  assert.equal(JSON.stringify(receipt).includes('similarity'), false)
})

test('missing commitments, duplicate identities and diagnostic exposure never become a blind receipt', () => {
  const cohort = parseCohortQuery(query)
  assert.throws(() => freezeCohort(cohort, [{ ...pair('p1'), captureCommitment: undefined }]))
  assert.throws(() => freezeCohort(cohort, [pair('p1'), pair('p1')]))
  assert.throws(() => freezeCohort(cohort, [{ ...pair('p1'), similarity: .99 }]))
  assert.throws(() => freezeCohort(cohort, Array.from({ length: 51 }, (_, i) => pair(`p${i}`))))
})
