import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import NotesPage from './components/NotesPage.jsx'
import NoteDetail from './components/NoteDetail.jsx'
import ImportPage from './components/ImportPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'

export default function App() {
  const [page, setPage] = useState('notes')
  const [selectedNote, setSelectedNote] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [importKey, setImportKey] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  const renderPage = () => {
    if (selectedNote) {
      return <NoteDetail noteId={selectedNote} onBack={() => setSelectedNote(null)} />
    }

    switch (page) {
      case 'notes':
        return <NotesPage key={refreshKey} onSelect={setSelectedNote} />
      case 'import':
        return <ImportPage key={importKey} onDone={() => { setPage('notes'); refresh() }} />
      case 'settings':
        return <SettingsPage />
      default:
        return <NotesPage key={refreshKey} onSelect={setSelectedNote} />
    }
  }

  return (
    <div className="app">
      <Sidebar current={page} onNavigate={p => {
        setPage(p)
        setSelectedNote(null)
        if (p === 'import') setImportKey(k => k + 1)
      }} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}
