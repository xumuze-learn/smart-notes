import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { search, platform } = req.query
  let sql = 'SELECT * FROM notes'
  let conditions = []
  let params = []

  if (search) {
    conditions.push('(title LIKE ? OR summary LIKE ? OR keywords LIKE ? OR original_text LIKE ?)')
    const q = `%${search}%`
    params.push(q, q, q, q)
  }

  if (platform) {
    conditions.push('platform = ?')
    params.push(platform)
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }

  sql += ' ORDER BY created_at DESC'
  res.json(db.all(sql, params))
})

// 获取所有平台列表
router.get('/platforms', (req, res) => {
  const rows = db.all("SELECT platform, COUNT(*) as count FROM notes WHERE platform != '' GROUP BY platform ORDER BY count DESC")
  res.json(rows)
})

router.get('/:id', (req, res) => {
  const note = db.get('SELECT * FROM notes WHERE id = ?', [req.params.id])
  if (!note) return res.status(404).json({ error: 'Not found' })
  res.json(note)
})

router.post('/', (req, res) => {
  const { title, original_text, summary, keywords, source_url, platform } = req.body
  const result = db.run(
    'INSERT INTO notes (title, original_text, summary, keywords, source_url, platform) VALUES (?, ?, ?, ?, ?, ?)',
    [title, original_text, summary || '', keywords || '', source_url || '', platform || '']
  )
  const note = db.get('SELECT * FROM notes WHERE id = ?', [result.lastInsertRowid])
  res.json(note)
})

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM notes WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// 清空所有笔记
router.delete('/', (req, res) => {
  db.run('DELETE FROM notes')
  res.json({ success: true })
})

export default router
