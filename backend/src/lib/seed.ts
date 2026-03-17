import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@sprints.dev' },
    update: {},
    create: { name: 'Demo User', email: 'demo@sprints.dev', password },
  })

  const project = await prisma.project.upsert({
    where: { slug: 'my-first-project' },
    update: {},
    create: {
      name: 'My First Project',
      slug: 'my-first-project',
      description: 'Demo project for sprints tracker',
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  })

  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1',
      goal: 'Ship the MVP',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  const tasks = [
    { title: 'Setup authentication', status: 'DONE' as const, priority: 'HIGH' as const, storyPoints: 3 },
    { title: 'Build kanban board', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, storyPoints: 8 },
    { title: 'Sprint velocity chart', status: 'TODO' as const, priority: 'MEDIUM' as const, storyPoints: 5 },
    { title: 'Email notifications', status: 'BACKLOG' as const, priority: 'LOW' as const, storyPoints: 3 },
  ]

  for (const [i, task] of tasks.entries()) {
    await prisma.task.create({
      data: { ...task, projectId: project.id, sprintId: sprint.id, createdById: user.id, position: i },
    })
  }

  console.log('✅ Seed complete — demo@sprints.dev / password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
