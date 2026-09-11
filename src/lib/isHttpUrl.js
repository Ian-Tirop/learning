// <input type="url"> only validates URL grammar, not scheme — a
// `javascript:` URI passes it fine. Used to catch that client-side before
// it ever reaches the API, which enforces the same check server-side.
export function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
