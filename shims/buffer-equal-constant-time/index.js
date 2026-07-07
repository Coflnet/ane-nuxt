// Node >= 24 safe replacement for `buffer-equal-constant-time`.
//
// The published package monkeypatches `buffer.SlowBuffer.prototype` at import
// time, which throws on Node >= 24 where `SlowBuffer` was removed. It is pulled
// in transitively by firebase-admin (jwa -> jws), loaded by nuxt-vuefire's SSR
// auth, and crashes every server render / prerender. Callers (jwa) only use the
// default export as a constant-time buffer comparison, so this is sufficient.

function bufferEq(a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) return false
  if (a.length !== b.length) return false

  let c = 0
  for (let i = 0; i < a.length; i++) {
    c |= a[i] ^ b[i]
  }
  return c === 0
}

bufferEq.install = function () {}
bufferEq.restore = function () {}

module.exports = bufferEq
