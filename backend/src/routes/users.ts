import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

export const usersRouter = Router()
usersRouter.use(authenticate)

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
})

// PATCH /api/users/me
usersRouter.patch('/me', async (req: AuthRequest, res, next) => {
  try {
    const data = updateSchema.parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})

// GET /api/users/search?q=name — find users to invite
usersRouter.get('/search', async (req: AuthRequest, res, next) => {
  try {
    const { q } = req.query as { q: string }
    if (!q || q.length < 2) return res.json([])
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        NOT: { id: req.userId },
      },
      select: { id: true, name: true, email: true, avatarUrl: true },
      take: 10,
    })
    res.json(users)
  } catch (err) { next(err) }
})
