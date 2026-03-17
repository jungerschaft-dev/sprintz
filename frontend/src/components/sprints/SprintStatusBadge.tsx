import type { SprintStatus } from '@/types'
import styles from './SprintStatusBadge.module.css'

const config: Record<SprintStatus, { label: string; cls: string }> = {
  PLANNING: { label: 'Planning', cls: 'planning' },
  ACTIVE:   { label: 'Active',   cls: 'active' },
  COMPLETED:{ label: 'Done',     cls: 'completed' },
}

export function SprintStatusBadge({ status }: { status: SprintStatus }) {
  const { label, cls } = config[status]
  return <span className={`${styles.badge} ${styles[cls]}`}>{label}</span>
}
