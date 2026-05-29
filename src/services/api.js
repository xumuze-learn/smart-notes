import { notesDB } from './db.js'

const MIMO_API = 'https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages'
const MIMO_KEY = 'sk-csxl85gflrc0v3e6pqnsnlrfr1uaa1dnjqpm8uszf7031vqi'

// Notes
export const getNotes = (search, platform) => notesDB.getAll({ search, platform })
export const getNote = (id) => notesDB.getById(id)
export const createNote = (data) => notesDB.create(data)
export const deleteNote = (id) => notesDB.delete(id)
export const clearNotes = () => notesDB.clear()
export const getPlatforms = () => notesDB.getPlatforms()
export const exportNotes = () => notesDB.exportAll()

// MiMo AI 调用
async function callMimo(system, prompt) {
  const resp = await fetch(MIMO_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': MIMO_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!resp.ok) throw new Error(`API error: ${resp.status}`)
  const data = await resp.json()
  return data.content[0].text
}

// 生成摘要（可选调用，失败不影响保存）
export async function summarize(text) {
  try {
    const result = await callMimo(
      '你是一个笔记分析助手。返回严格的JSON格式。',
      `分析以下对话，返回JSON（不要markdown）：
{"title":"标题15字以内","summary":"摘要50字以内","keywords":"关键词逗号分隔最多5个"}

对话内容：
${text.slice(0, 4000)}`
    )
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { title: '', summary: '', keywords: '' }
  }
}
