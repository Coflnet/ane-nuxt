import type { LabelingPair } from './labelingQueue'

export interface LabelingCohort {
  cohortMode: 'enforce' | 'shadow_admitted'
  from: string
  until: string
  policyFingerprint: string
}

export function parseCohortQuery(search: string): LabelingCohort | null {
  const query = new URLSearchParams(search)
  const keys = ['cohortMode', 'from', 'until'] as const
  if (!keys.some(key => query.has(key)) && !query.has('policyFingerprint')) return null
  if (keys.some(key => query.getAll(key).length !== 1 || !query.get(key))) throw new Error('Incomplete review batch link')
  if (query.getAll('policyFingerprint').length > 1) throw new Error('Ambiguous policy fingerprint')
  const cohort = { ...Object.fromEntries(keys.map(key => [key, query.get(key)!])), policyFingerprint: query.get('policyFingerprint') ?? '' } as unknown as LabelingCohort
  if (!['enforce', 'shadow_admitted'].includes(cohort.cohortMode) || (cohort.policyFingerprint !== '' && !/^[a-f0-9]{64}$/.test(cohort.policyFingerprint))
    || ![cohort.from, cohort.until].every(date => date.endsWith('Z') && Number.isFinite(Date.parse(date)))) throw new Error('Invalid review batch link')
  return cohort
}

/** No scores/capture JSON in the reviewer file. Exported capture JSON must later match each commitment. */
export function freezeCohort(cohort: LabelingCohort, batch: LabelingPair[]) {
  if (batch.length > 50 || new Set(batch.map(pair => pair.pairId)).size !== batch.length
    || batch.some(pair => !pair.pairId || !/^[a-f0-9]{64}$/.test(pair.captureCommitment ?? '')
      || [pair.similarity, pair.secondBest, pair.decision, pair.groupKey, pair.clusterSeoId, pair.textSeoId].some(value => value != null))) throw new Error('Invalid blind review batch')
  const policies = new Set(batch.map(pair => pair.cohortPolicyFingerprint))
  const policyFingerprint = batch[0]?.cohortPolicyFingerprint ?? cohort.policyFingerprint
  if (batch.length && (policies.size !== 1 || !/^[a-f0-9]{64}$/.test(policyFingerprint ?? '')
    || (cohort.policyFingerprint && policyFingerprint !== cohort.policyFingerprint))) throw new Error('Review batch policy changed')
  return Object.freeze({ version: 1, frozenAt: new Date().toISOString(), selector: Object.freeze({ ...cohort, policyFingerprint }),
    pairs: Object.freeze(batch.map(pair => Object.freeze({ pairId: pair.pairId, captureCommitment: pair.captureCommitment! }))),
    limitations: ['Admitted visual decisions, not persisted attachments.', 'Recorded policy fingerprint does not certify the deployed code revision.', 'No certification of reviewer independence, product truth, training separation or population representativeness.'] })
}
