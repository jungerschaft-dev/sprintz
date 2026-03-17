import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

export const tasksRouter = Router()
tasksRouter.use(authenticate)

const createSchema = z.object({
  projectId: z.string().uuid(),
  sprintId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().uuid().optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
})

const updateSchema = createSchema.partial()

const moveSchema = z.object({
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  position: z.number().int().min(0),
  sprintId: z.string().uuid().nullable().optional(),
})

// GET /api/tasks?projectId=&sprintId=&status=&assignedToMe=true
tasksRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, sprintId, status, assignedToMe, myTasks } = req.query as Record<string, string>
    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(sprintId ? { sprintId } : {}),
        ...(status && { status: status as any }),
        ...(assignedToMe === 'true' && { assignedToId: req.userId }),
        ...(myTasks === 'true' && {
          OR: [{ assignedToId: req.userId }, { createdById: req.userId }],
        }),
        project: { members: { some: { userId: req.userId } } },
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    })
    res.json(tasks)
  } catch (err) { next(err) }
})

// POST /api/tasks
tasksRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { labelIds, ...data } = createSchema.parse(req.body)
    const task = await prisma.task.create({
      data: {
        ...data,
        createdById: req.userId!,
        ...(labelIds?.length && {
          labels: { create: labelIds.map((id) => ({ labelId: id })) },
        }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } },
      },
    })
    res.status(201).json(task)
  } catch (err) { next(err) }
})

// GET /api/tasks/:id
tasksRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, project: { members: { some: { userId: req.userId } } } },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        sprint: { select: { id: true, name: true } },
      },
    })
    if (!task) return res.status(404).json({ error: 'Not found' })
    res.json(task)
  } catch (err) { next(err) }
})

// PATCH /api/tasks/:id
tasksRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { labelIds, ...data } = updateSchema.parse(req.body)
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(labelIds !== undefined && {
          labels: {
            deleteMany: {},
            create: labelIds.map((id) => ({ labelId: id })),
          },
        }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } },
      },
    })
    res.json(task)
  } catch (err) { next(err) }
})

// PATCH /api/tasks/:id/move — drag-and-drop on kanban
tasksRouter.patch('/:id/move', async (req: AuthRequest, res, next) => {
  try {
    const { status, position, sprintId } = moveSchema.parse(req.body)
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status, position, ...(sprintId !== undefined && { sprintId }) },
    })
    res.json(task)
  } catch (err) { next(err) }
})

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { next(err) }
})

// POST /api/tasks/:id/comments
tasksRouter.post('/:id/comments', async (req: AuthRequest, res, next) => {
  try {
    const { body } = z.object({ body: z.string().min(1) }).parse(req.body)
    const comment = await prisma.comment.create({
      data: { taskId: req.params.id, userId: req.userId!, body },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    })
    res.status(201).json(comment)
  } catch (err) { next(err) }
})
