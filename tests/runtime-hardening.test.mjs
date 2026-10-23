import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = path => readFile(new URL(path, import.meta.url), 'utf8')

// The runtime image has a read-only root filesystem, so the flip report endpoint
// must only log to stdout and never write under cwd.
test('report-flip does not touch the filesystem', async () => {
  const source = await read('../server/api/report-flip.post.ts')
  assert.doesNotMatch(source, /node:fs/)
  assert.match(source, /console\.log\(`\[FLIP-REPORT/)
})

test('x-powered-by header is stripped by a nitro plugin', async () => {
  const source = await read('../server/plugins/no-powered-by.ts')
  assert.match(source, /render:response/)
  assert.match(source, /x-powered-by/)
})

test('icons are bundled locally, nothing is fetched at runtime', async () => {
  const config = await read('../nuxt.config.ts')
  assert.match(config, /fallbackToApi: false/)
  assert.doesNotMatch(config, /remote: 'jsdelivr'/)
  assert.match(config, /devtools: \{ enabled: false \}/)
  const pkg = JSON.parse(await read('../package.json'))
  for (const c of ['tabler', 'mdi', 'lucide', 'svg-spinners']) {
    assert.ok(pkg.dependencies[`@iconify-json/${c}`], `missing @iconify-json/${c}`)
  }
})

test('Dockerfile runtime is distroless and non-root', async () => {
  const dockerfile = await read('../Dockerfile')
  assert.match(dockerfile, /FROM gcr\.io\/distroless\/nodejs26-debian13:nonroot/)
  assert.match(dockerfile, /USER 65532:65532/)
  assert.doesNotMatch(dockerfile, /apt-get/)
})
