import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { redis } from '../lib/redis'

export interface AuthRequest extends Request {
  userId?: string
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = header.slice(7)

  // Check if token was blacklisted (logout)
  const blacklisted = await redis.get(`bl:${token}`)
  if (blacklisted) {
    return res.status(401).json({ error: 'Token revoked' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string }
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
