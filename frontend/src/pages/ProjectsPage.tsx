import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useCreateProject } from '@/hooks/useProjects.ts'
import { Button } from '@/components/ui/Button.tsx'
import { formatDistanceToNow } from 'date-fns'
import styles from './ProjectsPage.module.css'

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  function handleNameChange(val: string) {
    setName(val)
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    createProject.mutate({ name, slug, description: description || undefined }, {
      onSuccess: (p) => {
        setShowModal(false)
        setName(''); setSlug(''); setDescription('')
        navigate(`/projects/${p.id}`)
      },
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.sub}>All your sprint workspaces</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ New project</Button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading…</div>
      ) : projects?.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          <p>No projects yet</p>
          <Button onClick={() => setShowModal(true)}>Create your first project</Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {projects?.map((p) => (
            <button key={p.id} className={styles.card} onClick={() => navigate(`/projects/${p.id}`)}>
              <div className={styles.cardTop}>
                <span className={styles.cardIcon} style={{ background: stringToColor(p.name) }}>
                  {p.name[0].toUpperCase()}
                </span>
                <span className={styles.cardAge}>
                  {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                </span>
              </div>
              <h2 className={styles.cardName}>{p.name}</h2>
              {p.description && <p className={styles.cardDesc}>{p.description}</p>}
              <div className={styles.cardFooter}>
                <div className={styles.members}>
                  {p.members.slice(0, 5).map((m) => (
                    <span key={m.id} className={styles.memberAvatar} title={m.user.name}>
                      {m.user.name[0].toUpperCase()}
                    </span>
                  ))}
                </div>
                <span className={styles.memberCount}>{p.members.length} member{p.members.length !== 1 ? 's' : ''}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>New project</h2>
            <form onSubmit={handleCreate} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Project name</label>
                <input className={styles.input} value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="My awesome project" required autoFocus />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Slug</label>
                <input className={styles.input} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-awesome-project" pattern="[a-z0-9-]+" required />
                <span className={styles.hint}>Only lowercase letters, numbers, hyphens</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Description <span className={styles.optional}>(optional)</span></label>
                <textarea className={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" loading={createProject.isPending}>Create project</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function stringToColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return `hsl(${hash % 360}, 55%, 45%)`
}
