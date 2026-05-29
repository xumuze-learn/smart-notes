const BASE = '/api'

async function request(path, options = {}) {
  const resp = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  return resp.json()
}

// Notes
export const getNotes = (search, platform) => {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (platform) params.set('platform', platform)
  const qs = params.toString()
  return request(`/notes${qs ? `?${qs}` : ''}`)
}
export const getNote = (id) => request(`/notes/${id}`)
export const createNote = (data) => request('/notes', { method: 'POST', body: data })
export const deleteNote = (id) => request(`/notes/${id}`, { method: 'DELETE' })
export const clearNotes = () => request('/notes', { method: 'DELETE' })
export const getPlatforms = () => request('/notes/platforms')
