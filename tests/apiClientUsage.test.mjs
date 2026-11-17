import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

// Calls of the generated SDK (src/api-client/sdk.gen.ts) must go through the client that
// plugins/api-client.ts configures (NUXT_PUBLIC_API_BASE_URL in the browser, the in-cluster base
// during SSR). The same function names are also auto-imported from `#hey-api` (@hey-api/nuxt), whose
// own client is fixed to https://ane.coflnet.com, so a call without an explicit import silently
// ignores the configured base. Local E2E runs against a mock exposed this (zip lookups, plan state).
const root = path.resolve(import.meta.dirname, '..')
const scanned = ['components', 'pages', 'layouts', 'composable', 'composables', 'stores', 'utils', 'middleware', 'plugins']

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...await walk(full))
    else if (/\.(?:vue|ts)$/.test(e.name)) files.push(full)
  }
  return files
}

function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

async function sdkFunctionNames() {
  const sdk = await readFile(path.join(root, 'src/api-client/sdk.gen.ts'), 'utf8')
  return [...sdk.matchAll(/^export const (\w+) =/gm)].map(match => match[1])
}

async function sources() {
  const files = (await Promise.all(scanned.map(dir => walk(path.join(root, dir))))).flat()
  return Promise.all(files.map(async file => ({ file: path.relative(root, file), source: withoutComments(await readFile(file, 'utf8')) })))
}

function importedFromApiClient(source) {
  const names = new Set()
  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]~\/src\/api-client['"]/g)) {
    for (const part of match[1].split(',')) names.add(part.trim().split(/\s+as\s+/).pop())
  }
  return names
}

/** A local binding of the same name (e.g. a Promise's `resolve`) is not an SDK call. */
function declaresLocally(source, name) {
  return new RegExp(`(?:const|let|var|function)\\s+${name}\\b|[(,]\\s*${name}\\s*[,)]|\\b${name}\\s*=>`).test(source)
}

/** The options object of every `name({ ... })` call (also when the brace is on the next line), up to its closing brace. */
function callOptions(source, name) {
  const options = []
  if (declaresLocally(source, name)) return options
  const pattern = new RegExp(`(?<![\\w.$])${name}\\(\\s*\\{`, 'g')
  for (const match of source.matchAll(pattern)) {
    let depth = 0
    const start = match.index + match[0].length - 1
    for (let i = start; i < source.length; i++) {
      if (source[i] === '{') depth++
      if (source[i] === '}' && --depth === 0) {
        options.push(source.slice(start, i + 1))
        break
      }
    }
  }
  return options
}

test('generated SDK functions are imported from ~/src/api-client, never auto-imported from #hey-api', async () => {
  const names = await sdkFunctionNames()
  const autoImported = []
  for (const { file, source } of await sources()) {
    const imported = importedFromApiClient(source)
    for (const name of names) {
      if (callOptions(source, name).length && !imported.has(name)) autoImported.push(`${file}: ${name}`)
    }
  }
  assert.deepEqual(autoImported, [])
})

test('generated SDK calls never pass an AbortSignal (the client deep-clones it into a plain object)', async () => {
  const names = await sdkFunctionNames()
  const withSignal = []
  for (const { file, source } of await sources()) {
    for (const name of names) {
      if (callOptions(source, name).some(options => /\bsignal\b/.test(options))) withSignal.push(`${file}: ${name}`)
    }
  }
  assert.deepEqual(withSignal, [])
})

test('API requests use the configured base instead of a hard-coded production host', async () => {
  const hardCoded = []
  for (const { file, source } of await sources()) {
    if (/\$fetch[^(]*\(\s*['"`]https:\/\/ane\.coflnet\.com\/api/.test(source) || /API_BASE\s*=\s*['"]https:\/\/ane\.coflnet\.com/.test(source)) hardCoded.push(file)
  }
  assert.deepEqual(hardCoded, [])
})
