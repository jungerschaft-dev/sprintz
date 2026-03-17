import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

export const projectsRouter = Router()
projectsRouter.use(authenticate)

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
})

// GET /api/projects — list my projects
projectsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: req.userId } } },
      include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(projects)
  } catch (err) { next(err) }
})

// POST /api/projects
projectsRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createSchema.parse(req.body)
    const project = await prisma.project.create({
      data: {
        ...data,
        members: { create: { userId: req.userId!, role: 'OWNER' } },
      },
      include: { members: true },
    })
    res.status(201).json(project)
  } catch (err) { next(err) }
})

// GET /api/projects/:id
projectsRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, members: { some: { userId: req.userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        sprints: { orderBy: { createdAt: 'desc' } },
        labels: true,
      },
    })
    if (!project) return res.status(404).json({ error: 'Not found' })
    res.json(project)
  } catch (err) { next(err) }
})

// PATCH /api/projects/:id
projectsRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const member = await prisma.projectMember.findFirst({
      where: { projectId: req.params.id, userId: req.userId, role: 'OWNER' },
    })
    if (!member) return res.status(403).json({ error: 'Forbidden' })
    const data = createSchema.partial().parse(req.body)
    const project = await prisma.project.update({ where: { id: req.params.id }, data })
    res.json(project)
  } catch (err) { next(err) }
})

// DELETE /api/projects/:id
projectsRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const member = await prisma.projectMember.findFirst({
      where: { projectId: req.params.id, userId: req.userId, role: 'OWNER' },
    })
    if (!member) return res.status(403).json({ error: 'Forbidden' })
    await prisma.project.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { next(err) }
})
