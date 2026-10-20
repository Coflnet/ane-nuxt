import assert from 'node:assert/strict'
import test from 'node:test'
import { isDisabledByError, isPausedForInactivity, withoutInactivityPause } from '../utils/filterState.ts'

test('the paused and error flags are read from combined state strings and numbers', () => {
  assert.equal(isPausedForInactivity('Disabled, DisabledInactive'), true)
  assert.equal(isPausedForInactivity(4), true)
  assert.equal(isPausedForInactivity('None'), false)
  assert.equal(isDisabledByError('DisabledError, DisabledInactive'), true)
  assert.equal(isDisabledByError(undefined), false)
})

test('reactivating clears only the inactivity pause', () => {
  assert.equal(withoutInactivityPause('DisabledInactive'), 'None')
  assert.equal(withoutInactivityPause('Disabled, DisabledInactive'), 'Disabled')
  assert.equal(withoutInactivityPause(6), 'DisabledError')
})
