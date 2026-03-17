import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { projectsRouter } from './routes/projects'
import { sprintsRouter } from './routes/sprints'
import { tasksRouter } from './routes/tasks'
import { usersRouter } from './routes/users'
import { calendarRouter } from './routes/calendar'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/sprints', sprintsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/calendar', calendarRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
