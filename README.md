# ⚡ Sprints — Sprint tracker monorepo

Full-stack sprint/kanban tracker. React + Express + PostgreSQL + Redis.

## Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, React Query, Zustand, React Router |
| Backend   | Node.js, Express, TypeScript, Prisma ORM, Zod |
| Database  | PostgreSQL 16                             |
| Cache     | Redis 7 (JWT blacklist, sprint cache)     |
| Infra     | Docker Compose                            |

## Structure

```
sprints/
├── apps/
│   ├── backend/
│   │   ├── prisma/schema.prisma      # DB schema
│   │   └── src/
│   │       ├── index.ts              # Express entry
│   │       ├── lib/                  # prisma, redis clients
│   │       ├── middleware/           # auth (JWT), errorHandler
│   │       └── routes/               # auth, projects, sprints, tasks, users
│   └── frontend/
│       └── src/
│           ├── components/           # UI, layout, board, sprints
│           ├── hooks/                # React Query hooks per resource
│           ├── pages/                # Login, Register, Projects, Project, Sprint
│           ├── store/                # Zustand (auth)
│           ├── types/                # Shared TS types
│           └── lib/                  # axios client
├── docker-compose.yml
└── package.json                      # npm workspaces root
```

## Quick start

### 1. Start database services
```bash
docker-compose up -d
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure backend env
```bash
cp apps/backend/.env.example apps/backend/.env
```

### 4. Run DB migrations & generate Prisma client
```bash
npm run db:migrate
npm run db:generate
```

### 5. (Optional) Seed demo data
```bash
npm run db:seed --workspace=apps/backend
# Login: demo@sprints.dev / password123
```

### 6. Run everything
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Prisma Studio: `npm run db:studio`

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id

GET    /api/sprints?projectId=
POST   /api/sprints
GET    /api/sprints/:id
PATCH  /api/sprints/:id
DELETE /api/sprints/:id

GET    /api/tasks?sprintId=
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
PATCH  /api/tasks/:id/move   ← drag-and-drop
DELETE /api/tasks/:id
POST   /api/tasks/:id/comments

GET    /api/users/search?q=
PATCH  /api/users/me
```
