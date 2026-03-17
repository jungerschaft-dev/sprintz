import type { Task, Priority } from '@/types'
import styles from './TaskCard.module.css'

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  LOW:      { label: 'Low',      color: 'var(--text-3)' },
  MEDIUM:   { label: 'Med',      color: 'var(--blue)' },
  HIGH:     { label: 'High',     color: 'var(--amber)' },
  CRITICAL: { label: 'Critical', color: 'var(--red)' },
}

interface Props {
  task: Task
  onDragStart: () => void
  onClick: () => void
  onDelete: () => void
  onToggleDone: () => void
  isDragging: boolean
}

export function TaskCard({ task, onDragStart, onClick, onDelete, onToggleDone, isDragging }: Props) {
  const priority = priorityConfig[task.priority]
  const isDone = task.status === 'DONE'

  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ''} ${isDone ? styles.done : ''}`}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      {/* Priority stripe */}
      <div className={styles.stripe} style={{ background: priority.color }} />

      <button
        className={`${styles.checkBtn} ${isDone ? styles.checkBtnDone : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleDone() }}
        title={isDone ? 'Отметить не выполненной' : 'Отметить выполненной'}
      >
        {isDone && <span className={styles.checkMark}>✓</span>}
      </button>

      <div className={styles.body}>
        <p className={`${styles.title} ${isDone ? styles.titleDone : ''}`}>{task.title}</p>

        <div className={styles.meta}>
          {task.labels?.map(({ label }) => (
            <span key={label.id} className={styles.label} style={{ background: label.color + '22', color: label.color, borderColor: label.color + '44' }}>
              {label.name}
            </span>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {task.storyPoints != null && (
              <span className={styles.points}>{task.storyPoints}pt</span>
            )}
            <span className={styles.priority} style={{ color: priority.color }}>{priority.label}</span>
            {(task._count?.comments ?? 0) > 0 && (
              <span className={styles.comments}>💬 {task._count?.comments}</span>
            )}
          </div>

          <div className={styles.footerRight}>
            {task.assignedTo && (
              <span className={styles.avatar} title={task.assignedTo.name}>
                {task.assignedTo.name[0].toUpperCase()}
              </span>
            )}
            <button
              className={styles.deleteBtn}
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              title="Delete task"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
