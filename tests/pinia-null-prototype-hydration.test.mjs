import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// devalue 5 deserializes null-prototype objects into the SSR payload. pinia 2.3.1
// called obj.hasOwnProperty() on them in shouldHydrate, which threw and turned the
// 404 error page for unknown URLs (/.env, /wp-login.php) into an HTTP 500.
test('installed pinia is v3 or newer', async () => {
  const pkg = JSON.parse(await readFile(new URL('../node_modules/pinia/package.json', import.meta.url), 'utf8'))
  assert.ok(Number(pkg.version.split('.')[0]) >= 3, `pinia ${pkg.version} is too old`)
})

test('shouldHydrate accepts null-prototype objects', async () => {
  const { shouldHydrate } = await import('pinia')
  const payloadState = Object.create(null)
  payloadState.value = 1
  assert.doesNotThrow(() => shouldHydrate(payloadState))
  assert.equal(shouldHydrate(payloadState), true)
  assert.equal(shouldHydrate(Object.create(null)), true)
})

// nitro imports the top-level h3 and needs the 1.x API; a hoisted h3 2.x (pulled in by
// dev tooling) breaks every request with "event.req.headers.entries is not a function".
test('top-level h3 stays on 1.x', async () => {
  const pkg = JSON.parse(await readFile(new URL('../node_modules/h3/package.json', import.meta.url), 'utf8'))
  assert.equal(pkg.version.split('.')[0], '1')
})
