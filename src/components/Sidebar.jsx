import React from 'react'

const navItems = [
  { key: 'notes', icon: '📝', label: '笔记' },
  { key: 'import', icon: '📥', label: '导入' },
  { key: 'settings', icon: '⚙️', label: '设置' },
]

export default function Sidebar({ current, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>✨</span> Smart Notes
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.key}
            className={`nav-item ${current === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
