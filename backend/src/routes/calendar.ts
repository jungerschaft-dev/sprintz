import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

export const calendarRouter = Router()
calendarRouter.use(authenticate)

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  type: z.enum(['EVENT', 'TASK']).optional(),
  completed: z.boolean().optional(),
})

const updateSchema = eventSchema.partial()

// GET /api/calendar/today-tasks — today's TASK events for progress bar
calendarRouter.get('/today-tasks', async (req: AuthRequest, res, next) => {
  try {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const events = await prisma.calendarEvent.findMany({
      where: { userId: req.userId, type: 'TASK', startAt: { gte: start, lte: end } },
      orderBy: { startAt: 'asc' },
    })
    res.json(events)
  } catch (err) { next(err) }
})

// PATCH /api/calendar/events/:id/toggle — toggle completed
calendarRouter.patch('/events/:id/toggle', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: { completed: !existing.completed },
    })
    res.json(event)
  } catch (err) { next(err) }
})

// GET /api/calendar/events?from=&to=
calendarRouter.get('/events', async (req: AuthRequest, res, next) => {
  try {
    const { from, to } = req.query as Record<string, string>
    const where: any = { userId: req.userId }
    if (from || to) {
      where.startAt = {}
      if (from) where.startAt.gte = new Date(from)
      if (to) where.startAt.lte = new Date(to)
    }
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
    })
    res.json(events)
  } catch (err) { next(err) }
})

// POST /api/calendar/events
calendarRouter.post('/events', async (req: AuthRequest, res, next) => {
  try {
    const data = eventSchema.parse(req.body)
    const event = await prisma.calendarEvent.create({
      data: { ...data, userId: req.userId! },
    })
    res.status(201).json(event)
  } catch (err) { next(err) }
})

// PATCH /api/calendar/events/:id
calendarRouter.patch('/events/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const data = updateSchema.parse(req.body)
    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data,
    })
    res.json(event)
  } catch (err) { next(err) }
})

// DELETE /api/calendar/events/:id
calendarRouter.delete('/events/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    await prisma.calendarEvent.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { next(err) }
})
