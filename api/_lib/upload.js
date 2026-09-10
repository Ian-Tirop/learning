// Shared image-upload helper for both the reader-facing and admin-facing
// dispatch files — avatars, post covers, and inline post-body images all
// go through this one function. Accepts a data URL (base64) rather than
// multipart/form-data: Vercel's default body parser already handles JSON,
// so this avoids pulling in a multipart-parsing dependency for what's a
// small, infrequent upload path.
import { put } from '@vercel/blob'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

// `dataUrl` looks like "data:image/png;base64,iVBORw0KG...".
export async function uploadImageFromDataUrl(dataUrl, keyPrefix) {
  if (typeof dataUrl !== 'string') {
    throw Object.assign(new Error('An image is required.'), { statusCode: 400 })
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    throw Object.assign(new Error('That file could not be read as an image.'), { statusCode: 400 })
  }

  const [, contentType, base64] = match
  if (!ALLOWED_TYPES.has(contentType)) {
    throw Object.assign(new Error('Only PNG, JPEG, WebP, or GIF images are allowed.'), { statusCode: 400 })
  }

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > MAX_BYTES) {
    throw Object.assign(new Error('Images must be under 5MB.'), { statusCode: 400 })
  }

  const extension = contentType.split('/')[1]
  const filename = `${keyPrefix}/${crypto.randomUUID()}.${extension}`

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  })

  return blob.url
}
