import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'
import { authenticate, AuthRequest } from '../middleware/auth'

export const sprintsRouter = Router()
sprintsRouter.use(authenticate)

const createSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  goal: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const updateSchema = createSchema.partial().extend({
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED']).optional(),
})

// GET /api/sprints?projectId=xxx
sprintsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query as { projectId: string }
    if (!projectId) return res.status(400).json({ error: 'projectId required' })

    const cacheKey = `sprints:${projectId}`
    const cached = await redis.get(cacheKey)
    if (cached) return res.json(JSON.parse(cached))

    const sprints = await prisma.sprint.findMany({
      where: { projectId, project: { members: { some: { userId: req.userId } } } },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
    })

    await redis.set(cacheKey, JSON.stringify(sprints), 'EX', 60)
    res.json(sprints)
  } catch (err) { next(err) }
})

// POST /api/sprints
sprintsRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createSchema.parse(req.body)
    const member = await prisma.projectMember.findFirst({
      where: { projectId: data.projectId, userId: req.userId },
    })
    if (!member) return res.status(403).json({ error: 'Forbidden' })

    const sprint = await prisma.sprint.create({ data })
    await redis.del(`sprints:${data.projectId}`)
    res.status(201).json(sprint)
  } catch (err) { next(err) }
})

// GET /api/sprints/:id
sprintsRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const sprint = await prisma.sprint.findFirst({
      where: { id: req.params.id, project: { members: { some: { userId: req.userId } } } },
      include: {
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, avatarUrl: true } },
            labels: { include: { label: true } },
            _count: { select: { comments: true } },
          },
          orderBy: [{ status: 'asc' }, { position: 'asc' }],
        },
      },
    })
    if (!sprint) return res.status(404).json({ error: 'Not found' })
    res.json(sprint)
  } catch (err) { next(err) }
})

// PATCH /api/sprints/:id
sprintsRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = updateSchema.parse(req.body)
    const sprint = await prisma.sprint.update({ where: { id: req.params.id }, data })
    await redis.del(`sprints:${sprint.projectId}`)
    res.json(sprint)
  } catch (err) { next(err) }
})

// DELETE /api/sprints/:id
sprintsRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const sprint = await prisma.sprint.delete({ where: { id: req.params.id } })
    await redis.del(`sprints:${sprint.projectId}`)
    res.status(204).send()
  } catch (err) { next(err) }
})
