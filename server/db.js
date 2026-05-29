import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'smartnotes.db')

const SQL = await initSqlJs()

let db
if (existsSync(DB_PATH)) {
  const buffer = readFileSync(DB_PATH)
  db = new SQL.Database(buffer)
} else {
  db = new SQL.Database()
}

function save() {
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

// 初始化表
db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    original_text TEXT NOT NULL,
    summary TEXT DEFAULT '',
    keywords TEXT DEFAULT '',
    source_url TEXT DEFAULT '',
    platform TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`)

// 兼容旧数据库：如果 platform 列不存在则添加
try { db.run('SELECT platform FROM notes LIMIT 1') } catch {
  db.run('ALTER TABLE notes ADD COLUMN platform TEXT DEFAULT ""')
}

db.run(`
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'concept',
    mention_count INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    relation_type TEXT DEFAULT 'related',
    UNIQUE(source_id, target_id, relation_type),
    FOREIGN KEY (source_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES entities(id) ON DELETE CASCADE
  )
`)

save()

// 封装常用操作
const helper = {
  all(sql, params = []) {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  },

  get(sql, params = []) {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const row = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return row
  },

  run(sql, params = []) {
    db.run(sql, params)
    save()
    const result = db.exec('SELECT last_insert_rowid()')
    const id = result.length > 0 ? result[0].values[0][0] : 0
    return { lastInsertRowid: id }
  },

  exec(sql) {
    db.run(sql)
    save()
  },

  save
}

export default helper
