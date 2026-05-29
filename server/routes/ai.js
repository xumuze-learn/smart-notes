import { Router } from 'express'
import db from '../db.js'

const router = Router()

const MIMO_API = 'https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages'
let apiKey = 'sk-csxl85gflrc0v3e6pqnsnlrfr1uaa1dnjqpm8uszf7031vqi'

router.post('/key', (req, res) => {
  apiKey = req.body.apiKey
  res.json({ success: true })
})

async function callMimo(system, prompt) {
  const resp = await fetch(MIMO_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`API error ${resp.status}: ${err}`)
  }
  const data = await resp.json()
  return data.content[0].text
}

router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body
    const result = await callMimo(
      '你是一个笔记分析助手。请分析以下AI对话，返回JSON格式结果。',
      `请分析以下AI对话，返回严格的JSON格式（不要包含任何markdown标记）：
{
  "title": "一个简洁的标题（15字以内）",
  "summary": "对话摘要（50字以内）",
  "keywords": "关键词，用逗号分隔，最多5个"
}

对话内容：
${text.slice(0, 4000)}`
    )
    let parsed
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { title: text.slice(0, 30).replace(/\n/g, ' ') + '...', summary: '', keywords: '' }
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/extract', async (req, res) => {
  try {
    const { text } = req.body
    const result = await callMimo(
      '你是一个知识提取助手。从文本中提取实体和关系。',
      `从以下文本中提取知识实体和关系，返回严格的JSON格式（不要包含任何markdown标记）：
{
  "entities": [
    {"name": "实体名称", "type": "concept|tool|person|topic"}
  ],
  "relations": [
    {"source": "实体1", "target": "实体2", "type": "关系描述"}
  ]
}

type 取值：concept=概念, tool=工具, person=人物, topic=主题

文本内容：
${text.slice(0, 3000)}`
    )
    let parsed
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { entities: [], relations: [] }
    }

    const entityIds = {}
    for (const e of (parsed.entities || [])) {
      try {
        const r = db.run('INSERT INTO entities (name, type) VALUES (?, ?)', [e.name, e.type || 'concept'])
        entityIds[e.name] = r.lastInsertRowid
      } catch {
        db.run('UPDATE entities SET mention_count = mention_count + 1 WHERE name = ?', [e.name])
        entityIds[e.name] = db.get('SELECT id FROM entities WHERE name = ?', [e.name])?.id
      }
    }
    for (const r of (parsed.relations || [])) {
      const sid = entityIds[r.source] || db.get('SELECT id FROM entities WHERE name = ?', [r.source])?.id
      const tid = entityIds[r.target] || db.get('SELECT id FROM entities WHERE name = ?', [r.target])?.id
      if (sid && tid) {
        try {
          db.run('INSERT INTO relations (source_id, target_id, relation_type) VALUES (?, ?, ?)',
            [sid, tid, r.type || 'related'])
        } catch { /* skip */ }
      }
    }
    res.json({ success: true, ...parsed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
