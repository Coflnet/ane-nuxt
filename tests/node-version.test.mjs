import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const expectedNodeMajor = 26

test('repository runtime declarations target Node.js 26', async () => {
  const [dockerfile, nvmrc, packageJson, readme] = await Promise.all([
    readFile(new URL('../Dockerfile', import.meta.url), 'utf8'),
    readFile(new URL('../.nvmrc', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../README.md', import.meta.url), 'utf8'),
  ])
  const packageMetadata = JSON.parse(packageJson)
  const dockerImages = [...dockerfile.matchAll(/^FROM node:(\S+)/gm)].map(match => match[1])

  assert.equal(Number.parseInt(process.versions.node, 10), expectedNodeMajor)
  assert.equal(nvmrc.trim(), String(expectedNodeMajor))
  assert.equal(packageMetadata.engines.node, '>=26 <27')
  assert.equal(packageMetadata.engines.npm, '>=11 <12')
  assert.equal(packageMetadata.packageManager, 'npm@11.5.2')
  assert.deepEqual(dockerImages, ['26-slim', '26-slim'])
  assert.match(readme, /Node\.js 26 and npm 11/)
})
