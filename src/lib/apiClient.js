async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers },
    credentials: 'same-origin',
  })

  // A 204 (e.g. DELETE) has no body. Anything else MUST be JSON — if it's
  // not (e.g. plain `vite`/`npm run dev` has no /api routes and falls back
  // to serving index.html with a 200 for any unmatched request), treat that
  // as a failure instead of silently resolving with garbage data.
  if (response.status === 204) return {}

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Request to ${path} didn't get a JSON response (status ${response.status}) — the API may not be running here.`,
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || `Request to ${path} failed (${response.status}).`)
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
