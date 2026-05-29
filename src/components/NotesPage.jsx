import React, { useState, useEffect, useRef } from 'react'
import { getNotes, getPlatforms } from '../services/api.js'

export default function NotesPage({ onSelect }) {
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('')
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    loadPlatforms()
  }, [])

  useEffect(() => {
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      loadNotes()
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [search, platform])

  async function loadPlatforms() {
    const data = await getPlatforms()
    setPlatforms(data)
  }

  async function loadNotes() {
    const data = await getNotes(search, platform)
    setNotes(data)
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">我的笔记</div>
          <div className="page-subtitle">{notes.length} 条 AI 对话记录</div>
        </div>
        <div className="header-filters">
          {platforms.length > 0 && (
            <select
              className="role-select"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              <option value="">全部平台</option>
              {platforms.map(p => (
                <option key={p.platform} value={p.platform}>
                  {p.platform} ({p.count})
                </option>
              ))}
            </select>
          )}
          <input
            className="search-box"
            placeholder="搜索标题、摘要、对话内容..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && (search || platform) ? (
        <div className="loading"><div className="spinner"></div> 搜索中...</div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">
            {search || platform ? '没有找到匹配的笔记' : '还没有笔记'}
          </div>
          <div className="empty-state-desc">
            {search || platform ? '试试换个关键词或平台' : '去"导入"页面粘贴你的 AI 对话，开始积累知识吧'}
          </div>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map(note => (
            <div key={note.id} className="note-card" onClick={() => onSelect(note.id)}>
              <div className="note-card-title">{note.title}</div>
              {note.summary && <div className="note-card-summary">{note.summary}</div>}
              <div className="note-card-meta">
                <span>{new Date(note.created_at).toLocaleDateString('zh-CN')}</span>
                <div className="note-card-tags">
                  {note.platform && <span className="tag platform-tag">{note.platform}</span>}
                  {note.keywords && note.keywords.split(',').slice(0, 2).map((kw, i) => (
                    <span key={i} className="tag">{kw.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
