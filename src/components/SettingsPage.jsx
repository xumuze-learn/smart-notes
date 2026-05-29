import React, { useState } from 'react'
import { clearNotes } from '../services/api.js'

export default function SettingsPage() {
  const [status, setStatus] = useState('')

  async function handleClearNotes() {
    if (!confirm('确定要清空所有笔记吗？此操作不可恢复。')) return
    await clearNotes()
    setStatus('✅ 已清空所有笔记')
    setTimeout(() => setStatus(''), 3000)
  }

  function handleExport() {
    // 导出所有笔记为 JSON
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `smart-notes-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        setStatus('✅ 导出成功')
        setTimeout(() => setStatus(''), 3000)
      })
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">设置</div>
      </div>

      <div className="settings-section">
        <h3>数据管理</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <button className="btn" onClick={handleExport}>📦 导出备份</button>
          <button className="btn btn-danger" onClick={handleClearNotes}>🗑️ 清空所有笔记</button>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          数据存储在本地浏览器中，导出备份可防止数据丢失
        </p>
      </div>

      <div className="settings-section">
        <h3>关于</h3>
        <p>Smart Notes - AI 对话的收藏夹</p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          将 AI 对话转化为结构化的个人知识库。<br />
          支持 DeepSeek、Kimi、ChatGPT、Claude 等平台。
        </p>
      </div>

      {status && (
        <div style={{ marginTop: 12, color: status.includes('✅') ? 'var(--green)' : 'var(--red)' }}>
          {status}
        </div>
      )}
    </div>
  )
}
