import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

// composable/ (singular) is not an auto-import directory, so every use needs an explicit import.
const root = path.resolve(import.meta.dirname, '..')
const scanned = ['components', 'pages', 'layouts', 'composable', 'composables', 'utils', 'middleware', 'plugins']

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...await walk(full))
    else if (/\.(vue|ts)$/.test(e.name)) files.push(full)
  }
  return files
}

test('composables from composable/ are imported where they are used', async () => {
  const names = (await readdir(path.join(root, 'composable')))
    .filter(f => f.endsWith('.ts'))
    .map(f => f.replace(/\.ts$/, ''))
  const missing = []
  for (const dir of scanned) {
    for (const file of await walk(path.join(root, dir))) {
      // drop comments, they may name a composable without calling it
      const source = (await readFile(file, 'utf8'))
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      for (const name of names) {
        if (path.basename(file) === `${name}.ts`) continue
        if (!new RegExp(`\\b${name}\\s*\\(`).test(source)) continue
        const imported = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from`).test(source)
        if (!imported) missing.push(`${path.relative(root, file)}: ${name}`)
      }
    }
  }
  assert.deepEqual(missing, [])
})
