import { openDB } from 'idb'

const DB_NAME = 'smart-notes'
const DB_VERSION = 1

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // 笔记表
    if (!db.objectStoreNames.contains('notes')) {
      const notes = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true })
      notes.createIndex('platform', 'platform')
      notes.createIndex('created_at', 'created_at')
    }
  },
})

function now() {
  return new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 19).replace('T', ' ')
}

// Notes 操作
export const notesDB = {
  async getAll({ search, platform } = {}) {
    const db = await dbPromise
    let notes = await db.getAll('notes')

    // 按平台筛选
    if (platform) {
      notes = notes.filter(n => n.platform === platform)
    }

    // 搜索
    if (search) {
      const q = search.toLowerCase()
      notes = notes.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.original_text || '').toLowerCase().includes(q) ||
        (n.summary || '').toLowerCase().includes(q) ||
        (n.keywords || '').toLowerCase().includes(q)
      )
    }

    // 按时间倒序
    notes.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return notes
  },

  async getById(id) {
    const db = await dbPromise
    return db.get('notes', Number(id))
  },

  async create(data) {
    const db = await dbPromise
    const note = {
      title: data.title || '',
      original_text: data.original_text || '',
      summary: data.summary || '',
      keywords: data.keywords || '',
      platform: data.platform || '',
      created_at: now(),
      updated_at: now(),
    }
    const id = await db.add('notes', note)
    return { ...note, id }
  },

  async delete(id) {
    const db = await dbPromise
    await db.delete('notes', Number(id))
  },

  async clear() {
    const db = await dbPromise
    await db.clear('notes')
  },

  async getPlatforms() {
    const db = await dbPromise
    const notes = await db.getAll('notes')
    const countMap = {}
    for (const n of notes) {
      if (n.platform) {
        countMap[n.platform] = (countMap[n.platform] || 0) + 1
      }
    }
    return Object.entries(countMap).map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count)
  },

  async exportAll() {
    const db = await dbPromise
    return db.getAll('notes')
  },
}
