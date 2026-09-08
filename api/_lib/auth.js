// Two kinds of session, both signed with the same HMAC secret:
// - "admin": the one Ian login, gated on ADMIN_PASSWORD, no accounts table.
// - "reader": an optional account a reader can create to track/edit their
//   own submissions across devices — see api/accounts/*.js.
import crypto from 'node:crypto'

const ADMIN_COOKIE = 'admin_session'
const READER_COOKIE = 'reader_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14 // 14 days
const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000)

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return secret
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

// `subject` is a free-form id carried in the token — 'admin' for the admin
// session (there's only ever one), an account id for a reader session.
function createToken(role, subject, ttlMs = SESSION_TTL_MS) {
  const expires = Date.now() + ttlMs
  const payload = `${role}.${subject}.${expires}`
  return `${payload}.${sign(payload)}`
}

// Returns the token's subject if it's valid, unexpired, and matches
// `expectedRole` — null otherwise.
function verifyToken(token, expectedRole) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [role, subject, expires, signature] = parts
  const payload = `${role}.${subject}.${expires}`

  let expected
  try {
    expected = sign(payload)
  } catch {
    return null
  }

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (sigBuffer.length !== expectedBuffer.length) return null
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null
  if (Number(expires) < Date.now()) return null
  if (role !== expectedRole) return null
  return subject
}

export function createSessionToken() {
  return createToken('admin', 'admin')
}

export function verifySessionToken(token) {
  return verifyToken(token, 'admin') === 'admin'
}

const PENDING_2FA_TTL_MS = 1000 * 60 * 5 // 5 minutes — just long enough to type a code

// Issued after a correct password when 2FA is enabled, before the real
// session cookie is set — proves "this request just supplied the right
// password" without granting access until the code is verified too.
export function createPendingTwoFactorToken() {
  return createToken('admin-2fa-pending', 'admin', PENDING_2FA_TTL_MS)
}

export function verifyPendingTwoFactorToken(token) {
  return verifyToken(token, 'admin-2fa-pending') === 'admin'
}

export function createReaderSessionToken(accountId) {
  return createToken('reader', accountId)
}

// Returns the account id, or null if there's no valid reader session.
export function verifyReaderSessionToken(token) {
  return verifyToken(token, 'reader')
}

export function parseCookies(header) {
  const cookies = {}
  if (!header) return cookies
  header.split(';').forEach((part) => {
    const separatorIndex = part.indexOf('=')
    if (separatorIndex === -1) return
    const key = part.slice(0, separatorIndex).trim()
    const value = part.slice(separatorIndex + 1).trim()
    if (key) cookies[key] = decodeURIComponent(value)
  })
  return cookies
}

export function isAdminRequest(req) {
  const cookies = parseCookies(req.headers.cookie)
  return verifySessionToken(cookies[ADMIN_COOKIE])
}

// Returns the reader account id for this request, or null if not signed in.
export function getReaderAccountId(req) {
  const cookies = parseCookies(req.headers.cookie)
  return verifyReaderSessionToken(cookies[READER_COOKIE])
}

// Browsers silently refuse to store a `Secure` cookie over plain HTTP —
// that includes `vercel dev` on http://localhost, which would otherwise
// make login look like it succeeds (200 response) while the session cookie
// never actually gets set. Vercel's proxy sets x-forwarded-proto, so this
// is only ever non-https for genuinely-local, non-TLS requests.
function isHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https'
}

function buildCookie(name, token, req) {
  const secure = isHttps(req) ? ' Secure;' : ''
  return `${name}=${encodeURIComponent(token)}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`
}

function buildClear(name, req) {
  const secure = isHttps(req) ? ' Secure;' : ''
  return `${name}=;${secure} HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

export function buildSessionCookie(token, req) {
  return buildCookie(ADMIN_COOKIE, token, req)
}

export function buildClearCookie(req) {
  return buildClear(ADMIN_COOKIE, req)
}

export function buildReaderSessionCookie(token, req) {
  return buildCookie(READER_COOKIE, token, req)
}

export function buildClearReaderCookie(req) {
  return buildClear(READER_COOKIE, req)
}

export function requireAdmin(req, res) {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: 'Admin login required.' })
    return false
  }
  return true
}

export function safeEqual(a, b) {
  const bufferA = Buffer.from(String(a))
  const bufferB = Buffer.from(String(b))
  if (bufferA.length !== bufferB.length) return false
  return crypto.timingSafeEqual(bufferA, bufferB)
}

// Reader account passwords: salted scrypt, no extra dependency needed.
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, 'hex')
  const testHash = crypto.scryptSync(password, salt, 64)
  if (hashBuffer.length !== testHash.length) return false
  return crypto.timingSafeEqual(hashBuffer, testHash)
}
