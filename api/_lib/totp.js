// A from-scratch RFC 6238 TOTP implementation using only node:crypto — the
// algorithm is small and well-specified enough that pulling in a dependency
// for it isn't worth it (unlike QR generation, which stays a real library).
import crypto from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TIME_STEP_SECONDS = 30
const CODE_DIGITS = 6

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20))
}

function base32Encode(buffer) {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

function base32Decode(encoded) {
  let bits = 0
  let value = 0
  const bytes = []
  for (const char of encoded.toUpperCase().replace(/=+$/, '')) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

function hotp(secretBuffer, counter) {
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', secretBuffer).update(counterBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 10 ** CODE_DIGITS).padStart(CODE_DIGITS, '0')
}

export function otpauthUrl(secret, accountLabel, issuer = 'Ian Tirop Blog') {
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(CODE_DIGITS), period: String(TIME_STEP_SECONDS) })
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountLabel)}?${params}`
}

// Allows the code from one step before/after the current one, to absorb
// clock drift between the server and the admin's phone.
export function verifyTotpCode(secretBase32, code) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return false
  const secretBuffer = base32Decode(secretBase32)
  const counter = Math.floor(Date.now() / 1000 / TIME_STEP_SECONDS)

  for (let drift = -1; drift <= 1; drift++) {
    const expected = hotp(secretBuffer, counter + drift)
    const a = Buffer.from(expected)
    const b = Buffer.from(code)
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true
  }
  return false
}
