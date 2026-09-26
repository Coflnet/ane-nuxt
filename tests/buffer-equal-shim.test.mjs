import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const shimPath = 'shims/buffer-equal-constant-time'

// Regression: a relative `file:` override was resolved by npm relative to the
// dependent package (node_modules/jwa/shims/...), so `npm ci` installed a
// dangling link; a symlinked shim is also not traced into nitro's output.
// Either way SSR failed with "Cannot find module 'buffer-equal-constant-time'".
test('package-lock installs buffer-equal-constant-time as a copy of the local shim', async () => {
  const [lockJson, npmrc] = await Promise.all([
    readFile(new URL('../package-lock.json', import.meta.url), 'utf8'),
    readFile(new URL('../.npmrc', import.meta.url), 'utf8'),
  ])
  const lock = JSON.parse(lockJson)
  const entries = Object.keys(lock.packages).filter(path => path.endsWith('buffer-equal-constant-time'))

  // A symlinked file: dependency lives outside node_modules and is not copied
  // into nitro's .output/server/node_modules, so it must be installed as a copy.
  assert.match(npmrc, /^install-links=true$/m)
  assert.deepEqual(entries, ['node_modules/buffer-equal-constant-time'])
  assert.equal(lock.packages[entries[0]].resolved, `file:${shimPath}`)
  assert.equal(lock.packages[entries[0]].link, undefined)
})

test('shim compares buffers without touching SlowBuffer', () => {
  const bufferEq = require('../shims/buffer-equal-constant-time/index.js')
  assert.equal(bufferEq(Buffer.from('abc'), Buffer.from('abc')), true)
  assert.equal(bufferEq(Buffer.from('abc'), Buffer.from('abd')), false)
  assert.equal(bufferEq(Buffer.from('abc'), Buffer.from('ab')), false)
  assert.equal(bufferEq('abc', Buffer.from('abc')), false)
})
