import React, { useState, useEffect } from 'react'
import { getNote, deleteNote } from '../services/api.js'
import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
})

export default function NoteDetail({ noteId, onBack }) {
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadNote() }, [noteId])

  async function loadNote() {
    setLoading(true)
    const data = await getNote(noteId)
    setNote(data)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('确定要删除这条笔记吗？')) return
    await deleteNote(noteId)
    onBack()
  }

  // 解析对话内容
  function parseChat(text) {
    // 检查是否有 【用户】/【AI】 标记
    const hasMarkers = /【(用户|AI)】/.test(text)
    if (!hasMarkers) return null

    const parts = text.split(/【(用户|AI)】/g).filter(Boolean)
    const messages = []
    for (let i = 0; i < parts.length; i += 2) {
      const role = parts[i] === '用户' ? 'user' : 'ai'
      const content = (parts[i + 1] || '').trim()
      if (content) messages.push({ role, content })
    }
    return messages
  }

  if (loading) return <div className="loading"><div className="spinner"></div> 加载中...</div>
  if (!note) return <div className="empty-state">笔记不存在</div>

  const chatMessages = parseChat(note.original_text)

  return (
    <div className="note-detail">
      <button className="back-btn" onClick={onBack}>← 返回列表</button>

      <div className="note-detail-header">
        <div className="note-detail-title">{note.title}</div>
        <div className="note-detail-meta">
          <span>{new Date(note.created_at).toLocaleString('zh-CN')}</span>
          {note.source_url && <a href={note.source_url} target="_blank" rel="noopener">来源链接</a>}
        </div>
        {note.keywords && (
          <div className="note-detail-tags">
            {note.keywords.split(',').map((kw, i) => (
              <span key={i} className="tag">{kw.trim()}</span>
            ))}
          </div>
        )}
      </div>

      {note.summary && (
        <div className="note-section">
          <div className="note-section-title">摘要</div>
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked(note.summary) }} />
        </div>
      )}

      <div className="note-section">
        <div className="note-section-title">{chatMessages ? '对话' : '内容'}</div>
        {chatMessages ? (
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <span className="chat-role">{msg.role === 'user' ? '用户' : 'AI'}</span>
                <div className="chat-content" dangerouslySetInnerHTML={{
                  __html: marked(msg.content)
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="original-text-block">{note.original_text}</div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>删除笔记</button>
      </div>
    </div>
  )
}
