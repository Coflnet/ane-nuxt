import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)

// Regression: Argo's mandatory `trivy image --severity HIGH,CRITICAL
// --ignore-unfixed` scan rejected the image because nitro traced these
// vulnerable versions into .output/server/node_modules. Minimum fixed version
// per release line (major.minor, falling back to major).
const minimumFixedVersions = {
  'defu': ['6.1.5'],
  'devalue': ['5.6.2'],
  '@grpc/grpc-js': ['1.9.16', '1.10.12', '1.11.4', '1.12.7', '1.13.5', '1.14.4'],
  'h3': ['1.15.6'],
  'jws': ['3.2.3', '4.0.1'],
  'lodash': ['4.18.0'],
  'node-forge': ['1.4.0'],
  'protobufjs': ['7.6.1', '8.4.1'],
  'sharp': ['0.35.4'],
  'svgo': ['2.8.4', '3.3.5', '4.1.0'],
  'websocket-driver': ['0.7.5'],
}

const parse = version => version.split('-')[0].split('.').map(Number)
const compare = (a, b) => {
  const [x, y] = [parse(a), parse(b)]
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] - y[i]
  }
  return 0
}
const minimumFor = (installed, minimums) => {
  const [major, minor] = parse(installed)
  return minimums.find(m => parse(m)[0] === major && parse(m)[1] === minor)
    ?? minimums.filter(m => parse(m)[0] === major).sort(compare).at(-1)
}

test('package-lock resolves no version with a known fixable HIGH/CRITICAL advisory', async () => {
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'))
  const offenders = []

  for (const [path, entry] of Object.entries(lock.packages)) {
    for (const [name, minimums] of Object.entries(minimumFixedVersions)) {
      if (!path.endsWith(`node_modules/${name}`)) continue
      const minimum = minimumFor(entry.version, minimums)
      if (!minimum || compare(entry.version, minimum) < 0) {
        offenders.push(`${path}@${entry.version} (needs >= ${minimum ?? minimums.join(' | ')})`)
      }
    }
  }

  assert.deepEqual(offenders, [])
})

// Regression: sharp >= 0.33 loads its native binding and libvips from
// platform-specific @img packages through a dynamic require that nitro does not
// trace, so the runtime image lost image processing (/_ipx) unless the
// Dockerfile copies them into .output/server/node_modules.
test('runtime image ships the platform sharp binaries next to the traced sharp package', async () => {
  const [dockerfile, lockJson] = await Promise.all([
    readFile(new URL('../Dockerfile', import.meta.url), 'utf8'),
    readFile(new URL('../package-lock.json', import.meta.url), 'utf8'),
  ])
  const lockedSharp = JSON.parse(lockJson).packages['node_modules/sharp'].version

  assert.match(dockerfile, /for pkg in node_modules\/@img\/sharp-\*; do/)
  assert.match(dockerfile, /cp -R "\$pkg" \.output\/server\/node_modules\/@img\//)
  // Loading sharp proves the platform binding resolves from node_modules/@img.
  assert.equal(require('sharp').versions.sharp, lockedSharp)
})
