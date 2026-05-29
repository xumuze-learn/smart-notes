import express from 'express'
import cors from 'cors'
import notesRouter from './routes/notes.js'
import aiRouter from './routes/ai.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/notes', notesRouter)
app.use('/api/ai', aiRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
