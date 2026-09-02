// Single-admin auth: one password (ADMIN_PASSWORD), one signed, HttpOnly
// session cookie. No accounts table needed since there's exactly one admin.
import crypto from 'node:crypto'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14 // 14 days

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return secret
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function createSessionToken() {
  const expires = Date.now() + SESSION_TTL_MS
  const payload = `admin.${expires}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [role, expires, signature] = parts
  const payload = `${role}.${expires}`

  let expected
  try {
    expected = sign(payload)
  } catch {
    return false
  }

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (sigBuffer.length !== expectedBuffer.length) return false
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return false
  if (Number(expires) < Date.now()) return false
  return role === 'admin'
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
  return verifySessionToken(cookies[COOKIE_NAME])
}

// Browsers silently refuse to store a `Secure` cookie over plain HTTP —
// that includes `vercel dev` on http://localhost, which would otherwise
// make login look like it succeeds (200 response) while the session cookie
// never actually gets set. Vercel's proxy sets x-forwarded-proto, so this
// is only ever non-https for genuinely-local, non-TLS requests.
function isHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https'
}

export function buildSessionCookie(token, req) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  const secure = isHttps(req) ? ' Secure;' : ''
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${maxAge}`
}

export function buildClearCookie(req) {
  const secure = isHttps(req) ? ' Secure;' : ''
  return `${COOKIE_NAME}=;${secure} HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
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
