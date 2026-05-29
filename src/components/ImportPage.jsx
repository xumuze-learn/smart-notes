import React, { useState } from 'react'
import { createNote } from '../services/api.js'

const PLATFORMS = ['', 'DeepSeek', 'Kimi', 'ChatGPT', 'Claude', '豆包', '通义千问', '文心一言', '其他']

export default function ImportPage({ onDone }) {
  const [mode, setMode] = useState(null)
  const [messages, setMessages] = useState([{ role: 'user', text: '' }, { role: 'ai', text: '' }])
  const [answerText, setAnswerText] = useState('')
  const [answerTitle, setAnswerTitle] = useState('')
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('')
  const [importing, setImporting] = useState(false)

  function updateMessage(index, field, value) {
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function addMessage() {
    setMessages(prev => [...prev, { role: 'user', text: '' }])
  }

  function removeMessage(index) {
    if (messages.length <= 1) return
    setMessages(prev => prev.filter((_, i) => i !== index))
  }

  function resetChat() {
    setMode(null)
    setMessages([{ role: 'user', text: '' }, { role: 'ai', text: '' }])
    setPlatform('')
  }

  function resetAnswer() {
    setMode(null)
    setAnswerText('')
    setAnswerTitle('')
    setPlatform('')
  }

  async function handleSave() {
    setStatus('')
    setImporting(true)

    if (mode === 'chat') {
      const validMessages = messages.filter(m => m.text.trim())
      if (validMessages.length === 0) {
        setStatus('请至少填写一条内容')
        setImporting(false)
        return
      }

      const finalText = validMessages.map(m =>
        `【${m.role === 'user' ? '用户' : 'AI'}】${m.text.trim()}`
      ).join('\n\n')

      const firstUser = validMessages.find(m => m.role === 'user')
      const title = firstUser
        ? firstUser.text.trim().slice(0, 30).replace(/\n/g, ' ')
        : '对话记录'

      try {
        await createNote({ title, original_text: finalText, platform })
        setStatus('✅ 保存成功!')
        setTimeout(() => onDone(), 1000)
      } catch (err) {
        setStatus('❌ ' + err.message)
      }
    } else {
      if (!answerText.trim()) {
        setStatus('请粘贴内容')
        setImporting(false)
        return
      }

      const title = answerTitle.trim() || answerText.trim().slice(0, 30).replace(/\n/g, ' ') + '...'

      try {
        await createNote({ title, original_text: `【AI】${answerText.trim()}`, platform })
        setStatus('✅ 保存成功!')
        setTimeout(() => onDone(), 1000)
      } catch (err) {
        setStatus('❌ ' + err.message)
      }
    }

    setImporting(false)
  }

  // 平台选择器组件
  const platformSelect = (
    <div className="platform-select-wrap">
      <label className="platform-label">平台来源（选填）</label>
      <select className="role-select" value={platform} onChange={e => setPlatform(e.target.value)}>
        {PLATFORMS.map(p => <option key={p} value={p}>{p || '不选择'}</option>)}
      </select>
    </div>
  )

  // 选择模式
  if (!mode) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">导入对话</div>
            <div className="page-subtitle">选择导入类型</div>
          </div>
        </div>
        <div className="mode-select">
          <button className="mode-card" onClick={() => setMode('chat')}>
            <div className="mode-icon">💬</div>
            <div className="mode-label">对话</div>
            <div className="mode-desc">你和 AI 一来一回的交流</div>
          </button>
          <button className="mode-card" onClick={() => setMode('answer')}>
            <div className="mode-icon">💡</div>
            <div className="mode-label">回答</div>
            <div className="mode-desc">只保存 AI 的一条回复</div>
          </button>
        </div>
      </div>
    )
  }

  // 对话模式
  if (mode === 'chat') {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">💬 导入对话</div>
            <div className="page-subtitle">逐条粘贴，选择谁说的话</div>
          </div>
        </div>

        {platformSelect}

        <div className="chat-import-list">
          {messages.map((msg, i) => (
            <div key={i} className="chat-import-item">
              <div className="chat-import-header">
                <select
                  className="role-select"
                  value={msg.role}
                  onChange={e => updateMessage(i, 'role', e.target.value)}
                >
                  <option value="user">用户</option>
                  <option value="ai">AI</option>
                </select>
                {messages.length > 1 && (
                  <button className="btn btn-sm btn-danger" onClick={() => removeMessage(i)}>删除</button>
                )}
              </div>
              <textarea
                className="chat-import-textarea"
                placeholder={msg.role === 'user' ? '粘贴用户的问题...' : '粘贴 AI 的回答...'}
                value={msg.text}
                onChange={e => updateMessage(i, 'text', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="chat-import-actions">
          <button className="btn" onClick={addMessage}>+ 添加一条</button>
        </div>

        <div className="import-bottom-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={importing}>
            {importing ? '保存中...' : '保存'}
          </button>
          <button className="btn" onClick={resetChat}>返回</button>
          {status && <span className={`import-status ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : ''}`}>{status}</span>}
        </div>
      </div>
    )
  }

  // 回答模式
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">💡 导入回答</div>
          <div className="page-subtitle">粘贴 AI 的回答内容</div>
        </div>
      </div>

      {platformSelect}

      <input
        className="search-box"
        style={{ width: '100%', maxWidth: '100%', marginBottom: 12 }}
        placeholder="标题（选填）"
        value={answerTitle}
        onChange={e => setAnswerTitle(e.target.value)}
      />

      <textarea
        className="import-textarea"
        placeholder="粘贴 AI 回答内容..."
        value={answerText}
        onChange={e => setAnswerText(e.target.value)}
      />

      <div className="import-bottom-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={importing}>
          {importing ? '保存中...' : '保存'}
        </button>
        <button className="btn" onClick={resetAnswer}>返回</button>
        {status && <span className={`import-status ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : ''}`}>{status}</span>}
      </div>
    </div>
  )
}
