import { useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '@/hooks/useProjects.ts'
import { useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint } from '@/hooks/useSprints.ts'
import { Button } from '@/components/ui/Button.tsx'
import { SprintStatusBadge } from '@/components/sprints/SprintStatusBadge.tsx'
import { formatDistanceToNow, format } from 'date-fns'
import type { SprintStatus } from '@/types'
import styles from './ProjectPage.module.css'

export function ProjectPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const { data: project, isLoading } = useProject(projectId)
  const { data: sprints } = useSprints(projectId)
  const createSprint = useCreateSprint(projectId)
  const deleteSprint = useDeleteSprint(projectId)

  const [showModal, setShowModal] = useState(false)
  const [sprintName, setSprintName] = useState('')
  const [sprintGoal, setSprintGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    createSprint.mutate(
      {
        name: sprintName,
        goal: sprintGoal || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      },
      {
        onSuccess: (s) => {
          setShowModal(false)
          setSprintName(''); setSprintGoal(''); setStartDate(''); setEndDate('')
          navigate(`/projects/${projectId}/sprints/${s.id}`)
        },
      }
    )
  }

  if (isLoading) return <div className={styles.loading}>Loading…</div>
  if (!project) return <div className={styles.loading}>Project not found</div>

  const activeSprint = sprints?.find((s) => s.status === 'ACTIVE')
  const planningSprints = sprints?.filter((s) => s.status === 'PLANNING') ?? []
  const completedSprints = sprints?.filter((s) => s.status === 'COMPLETED') ?? []

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Projects</p>
          <h1 className={styles.title}>{project.name}</h1>
          {project.description && <p className={styles.desc}>{project.description}</p>}
        </div>
        <Button onClick={() => setShowModal(true)}>+ New sprint</Button>
      </div>

      {activeSprint && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Active sprint</h2>
          <SprintCard sprint={activeSprint} projectId={projectId} onDelete={(id) => deleteSprint.mutate(id)} navigate={navigate} />
        </section>
      )}

      {planningSprints.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Planning</h2>
          <div className={styles.sprintList}>
            {planningSprints.map((s) => (
              <SprintCard key={s.id} sprint={s} projectId={projectId} onDelete={(id) => deleteSprint.mutate(id)} navigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {completedSprints.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Completed</h2>
          <div className={styles.sprintList}>
            {completedSprints.map((s) => (
              <SprintCard key={s.id} sprint={s} projectId={projectId} onDelete={(id) => deleteSprint.mutate(id)} navigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {!sprints?.length && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🏃</span>
          <p>No sprints yet. Create one to get started.</p>
          <Button onClick={() => setShowModal(true)}>Create sprint</Button>
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>New sprint</h2>
            <form onSubmit={handleCreate} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Sprint name</label>
                <input className={styles.input} value={sprintName} onChange={(e) => setSprintName(e.target.value)} placeholder="Sprint 1" required autoFocus />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Goal <span className={styles.optional}>(optional)</span></label>
                <input className={styles.input} value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)} placeholder="What do you want to ship?" />
              </div>
              <div className={styles.dateRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Start date</label>
                  <input className={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>End date</label>
                  <input className={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" loading={createSprint.isPending}>Create sprint</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SprintCard({ sprint, projectId, onDelete, navigate }: {
  sprint: any; projectId: string; onDelete: (id: string) => void; navigate: (to: string) => void
}) {
  const updateSprint = useUpdateSprint(sprint.id, projectId)

  function cycleStatus() {
    const next: Record<string, SprintStatus> = { PLANNING: 'ACTIVE', ACTIVE: 'COMPLETED', COMPLETED: 'PLANNING' }
    updateSprint.mutate({ status: next[sprint.status] })
  }

  return (
    <div className={styles.sprintCard} onClick={() => navigate(`/projects/${projectId}/sprints/${sprint.id}`)}>
      <div className={styles.sprintTop}>
        <div className={styles.sprintLeft}>
          <SprintStatusBadge status={sprint.status} />
          <h3 className={styles.sprintName}>{sprint.name}</h3>
        </div>
        <div className={styles.sprintActions} onClick={(e) => e.stopPropagation()}>
          <button className={styles.actionBtn} onClick={cycleStatus} title="Cycle status">
            {sprint.status === 'PLANNING' ? '▶ Start' : sprint.status === 'ACTIVE' ? '✓ Complete' : '↺ Reopen'}
          </button>
          <button className={styles.actionBtn} style={{ color: 'var(--red)' }} onClick={() => onDelete(sprint.id)} title="Delete sprint">✕</button>
        </div>
      </div>
      {sprint.goal && <p className={styles.sprintGoal}>{sprint.goal}</p>}
      <div className={styles.sprintMeta}>
        {sprint.startDate && <span>📅 {format(new Date(sprint.startDate), 'MMM d')} → {sprint.endDate ? format(new Date(sprint.endDate), 'MMM d') : '?'}</span>}
        <span>📋 {sprint._count?.tasks ?? 0} tasks</span>
        <span className={styles.sprintAge}>{formatDistanceToNow(new Date(sprint.createdAt), { addSuffix: true })}</span>
      </div>
    </div>
  )
}
