export type Role = 'OWNER' | 'MEMBER' | 'VIEWER'
export type CalendarEventType = 'EVENT' | 'TASK'

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  color: string
  type: CalendarEventType
  completed: boolean
  createdAt: string
  updatedAt: string
}
export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED'
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: Role
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>
}

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  members: ProjectMember[]
  sprints?: Sprint[]
  labels?: Label[]
}

export interface Sprint {
  id: string
  projectId: string
  name: string
  goal: string | null
  status: SprintStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  tasks?: Task[]
  _count?: { tasks: number }
}

export interface Label {
  id: string
  projectId: string
  name: string
  color: string
}

export interface TaskLabel {
  taskId: string
  labelId: string
  label: Label
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  body: string
  createdAt: string
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>
}

export interface Task {
  id: string
  projectId: string
  sprintId: string | null
  createdById: string
  assignedToId: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  storyPoints: number | null
  position: number
  createdAt: string
  updatedAt: string
  assignedTo?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null
  createdBy?: Pick<User, 'id' | 'name' | 'avatarUrl'>
  labels?: TaskLabel[]
  comments?: Comment[]
  sprint?: Pick<Sprint, 'id' | 'name'> | null
  _count?: { comments: number }
}
