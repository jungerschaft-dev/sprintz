import { useState, FormEvent } from 'react'
import { useTask, useUpdateTask, useAddComment } from '@/hooks/useTasks.ts'
import { Button } from '@/components/ui/Button.tsx'
import { format } from 'date-fns'
import type { Task, TaskStatus, Priority } from '@/types'
import styles from './TaskModal.module.css'

const STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

interface Props { task: Task; sprintId: string; onClose: () => void }

export function TaskModal({ task: initialTask, sprintId, onClose }: Props) {
  const { data: task = initialTask } = useTask(initialTask.id)
  const updateTask = useUpdateTask(task.id, sprintId)
  const addComment = useAddComment(task.id)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority)
  const [storyPoints, setStoryPoints] = useState(task.storyPoints?.toString() ?? '')
  const [comment, setComment] = useState('')
  const [dirty, setDirty] = useState(false)

  function handleSave() {
    updateTask.mutate({
      title,
      description: description || undefined,
      status,
      priority,
      storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
    }, { onSuccess: () => setDirty(false) })
  }

  function handleComment(e: FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    addComment.mutate(comment.trim(), { onSuccess: () => setComment('') })
  }

  function markDirty() { setDirty(true) }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <div className={styles.titleRow}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty() }}
            placeholder="Task title"
          />
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Left: description + comments */}
          <div className={styles.left}>
            <label className={styles.sectionLabel}>Description</label>
            <textarea
              className={styles.descInput}
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty() }}
              placeholder="Add a description…"
              rows={5}
            />

            {/* Comments */}
            <label className={styles.sectionLabel} style={{ marginTop: 20 }}>Comments</label>
            <div className={styles.comments}>
              {task.comments?.map((c) => (
                <div key={c.id} className={styles.comment}>
                  <span className={styles.commentAvatar}>{c.user.name[0].toUpperCase()}</span>
                  <div className={styles.commentBody}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{c.user.name}</span>
                      <span className={styles.commentTime}>{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                    </div>
                    <p className={styles.commentText}>{c.body}</p>
                  </div>
                </div>
              ))}
              {!task.comments?.length && <p className={styles.noComments}>No comments yet</p>}
            </div>
            <form onSubmit={handleComment} className={styles.commentForm}>
              <input
                className={styles.commentInput}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
              />
              <Button type="submit" size="sm" loading={addComment.isPending} variant="secondary">Send</Button>
            </form>
          </div>

          {/* Right: metadata */}
          <div className={styles.right}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Status</label>
              <select className={styles.select} value={status} onChange={(e) => { setStatus(e.target.value as TaskStatus); markDirty() }}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Priority</label>
              <select className={styles.select} value={priority} onChange={(e) => { setPriority(e.target.value as Priority); markDirty() }}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Story points</label>
              <input
                className={styles.select}
                type="number"
                min={0}
                max={100}
                value={storyPoints}
                onChange={(e) => { setStoryPoints(e.target.value); markDirty() }}
                placeholder="—"
              />
            </div>

            {task.assignedTo && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Assignee</label>
                <div className={styles.assignee}>
                  <span className={styles.assigneeAvatar}>{task.assignedTo.name[0].toUpperCase()}</span>
                  <span className={styles.assigneeName}>{task.assignedTo.name}</span>
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Created</label>
              <span className={styles.metaVal}>{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
            </div>

            {dirty && (
              <Button onClick={handleSave} loading={updateTask.isPending} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                Save changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
