import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSprint, useUpdateSprint } from '@/hooks/useSprints.ts'
import { useSprintTasks, useCreateTask, useMoveTask, useDeleteTask, useToggleTaskDone } from '@/hooks/useTasks.ts'
import { useProject } from '@/hooks/useProjects.ts'
import { Button } from '@/components/ui/Button.tsx'
import { SprintStatusBadge } from '@/components/sprints/SprintStatusBadge.tsx'
import { TaskCard } from '@/components/board/TaskCard.tsx'
import { TaskModal } from '@/components/board/TaskModal.tsx'
import { format, differenceInDays } from 'date-fns'
import type { Task, TaskStatus } from '@/types'
import styles from './SprintPage.module.css'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'BACKLOG',     label: 'Backlog' },
  { status: 'TODO',        label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'IN_REVIEW',   label: 'In Review' },
  { status: 'DONE',        label: 'Done' },
]

export function SprintPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const navigate = useNavigate()

  const { data: sprint, isLoading: sprintLoading } = useSprint(sprintId)
  const { data: project } = useProject(projectId)
  const { data: tasks = [] } = useSprintTasks(sprintId)
  const createTask = useCreateTask(sprintId)
  const moveTask = useMoveTask(sprintId)
  const deleteTask = useDeleteTask(sprintId)
  const toggleDone = useToggleTaskDone(sprintId)
  const updateSprint = useUpdateSprint(sprintId, projectId)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  function handleDragStart(taskId: string) { setDraggedId(taskId) }
  function handleDragOver(e: React.DragEvent) { e.preventDefault() }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault()
    if (!draggedId) return
    const colTasks = tasks.filter((t) => t.status === status)
    moveTask.mutate({ id: draggedId, status, position: colTasks.length })
    setDraggedId(null)
  }

  function handleAddTask(status: TaskStatus) {
    if (!newTitle.trim()) { setAddingTo(null); return }
    createTask.mutate(
      { projectId, title: newTitle.trim(), status },
      { onSettled: () => { setAddingTo(null); setNewTitle('') } }
    )
  }

  const totalPoints = tasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0)
  const donePoints = tasks.filter((t) => t.status === 'DONE').reduce((s, t) => s + (t.storyPoints ?? 0), 0)
  const daysLeft = sprint?.endDate ? differenceInDays(new Date(sprint.endDate), new Date()) : null

  if (sprintLoading) return <div className={styles.loading}>Loading…</div>
  if (!sprint) return <div className={styles.loading}>Sprint not found</div>

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.back} onClick={() => navigate(`/projects/${projectId}`)}>
            ← {project?.name}
          </button>
          <div className={styles.sprintMeta}>
            <h1 className={styles.sprintName}>{sprint.name}</h1>
            <SprintStatusBadge status={sprint.status} />
          </div>
          {sprint.goal && <p className={styles.goal}>🎯 {sprint.goal}</p>}
        </div>

        <div className={styles.headerRight}>
          {/* Stats */}
          <div className={styles.stats}>
            {daysLeft !== null && (
              <div className={styles.stat}>
                <span className={styles.statVal} style={{ color: daysLeft < 3 ? 'var(--red)' : 'var(--text-1)' }}>
                  {daysLeft < 0 ? 'Overdue' : `${daysLeft}d`}
                </span>
                <span className={styles.statLabel}>left</span>
              </div>
            )}
            <div className={styles.stat}>
              <span className={styles.statVal}>{donePoints}/{totalPoints}</span>
              <span className={styles.statLabel}>points</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{tasks.filter(t => t.status === 'DONE').length}/{tasks.length}</span>
              <span className={styles.statLabel}>tasks</span>
            </div>
          </div>

          {sprint.status === 'PLANNING' && (
            <Button size="sm" onClick={() => updateSprint.mutate({ status: 'ACTIVE' })}>▶ Start sprint</Button>
          )}
          {sprint.status === 'ACTIVE' && (
            <Button size="sm" variant="secondary" onClick={() => updateSprint.mutate({ status: 'COMPLETED' })}>✓ Complete</Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalPoints > 0 && (
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${Math.round((donePoints / totalPoints) * 100)}%` }} />
        </div>
      )}

      {/* Dates */}
      {(sprint.startDate || sprint.endDate) && (
        <div className={styles.dates}>
          {sprint.startDate && <span>{format(new Date(sprint.startDate), 'MMM d, yyyy')}</span>}
          {sprint.startDate && sprint.endDate && <span className={styles.dateSep}>→</span>}
          {sprint.endDate && <span>{format(new Date(sprint.endDate), 'MMM d, yyyy')}</span>}
        </div>
      )}

      {/* Kanban board */}
      <div className={styles.board}>
        {COLUMNS.map(({ status, label }) => {
          const colTasks = tasks
            .filter((t) => t.status === status)
            .sort((a, b) => a.position - b.position)

          return (
            <div
              key={status}
              className={styles.column}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className={styles.colHeader}>
                <span className={styles.colLabel}>{label}</span>
                <span className={styles.colCount}>{colTasks.length}</span>
              </div>

              <div className={styles.cards}>
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => setSelectedTask(task)}
                    onDelete={() => deleteTask.mutate(task.id)}
                    onToggleDone={() => toggleDone.mutate({ id: task.id, isDone: task.status !== 'DONE' })}
                    isDragging={draggedId === task.id}
                  />
                ))}
              </div>

              {/* Quick add */}
              {addingTo === status ? (
                <div className={styles.quickAdd}>
                  <input
                    className={styles.quickInput}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title…"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(status)
                      if (e.key === 'Escape') { setAddingTo(null); setNewTitle('') }
                    }}
                    onBlur={() => handleAddTask(status)}
                  />
                </div>
              ) : (
                <button className={styles.addBtn} onClick={() => { setAddingTo(status); setNewTitle('') }}>
                  + Add task
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          sprintId={sprintId}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
