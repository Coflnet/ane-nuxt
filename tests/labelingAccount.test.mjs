import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { ofetch } from 'ofetch'

test('a stalled account request times out once and a manual retry succeeds', { timeout: 20_000 }, async () => {
  let requests = 0
  const server = createServer((_request, response) => {
    if (++requests === 1) return
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ canLabel: true, userId: 'synthetic-reviewer' }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const source = readFileSync(new URL('../composables/useLabelingApi.ts', import.meta.url), 'utf8')
    const code = stripTypeScriptTypes(source).replace(/^import .*$/gm, '').replace(/^export /gm, '')
    const api = new Function('useApiBaseUrl', 'useUserStore', '$fetch', `${code}; return useLabelingApi()`)(
      () => `http://127.0.0.1:${server.address().port}`, () => ({ token: 'synthetic' }), ofetch)
    const start = performance.now()
    await assert.rejects(api.me(), error => /timeout|timed out|aborted/i.test(String(error)))
    assert.ok(performance.now() - start < 15_000, 'account check must leave its loading state promptly')
    assert.equal(requests, 1, 'automatic retries must not extend the account deadline')
    assert.deepEqual(await api.me(), { canLabel: true, userId: 'synthetic-reviewer' })
    assert.equal(requests, 2)
  }
  finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})
