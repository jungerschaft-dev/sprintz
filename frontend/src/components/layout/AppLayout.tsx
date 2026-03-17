import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.ts'
import { useLogout } from '@/hooks/useAuth.ts'
import { useProjects } from '@/hooks/useProjects.ts'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const { data: projects } = useProjects()

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => navigate('/login') })
  }

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>⚡</span>
          <span className={styles.logoText}>Sprints</span>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/calendar"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📅</span>
            Календарь
          </NavLink>

          <span className={styles.navLabel}>Projects</span>
          {projects?.map((p) => (
            <NavLink
              key={p.id}
              to={`/projects/${p.id}`}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.projectDot} style={{ background: stringToColor(p.name) }} />
              {p.name}
            </NavLink>
          ))}
          <NavLink
            to="/projects"
            end
            className={({ isActive }) => `${styles.navItem} ${styles.newProject} ${isActive ? styles.active : ''}`}
          >
            + New project
          </NavLink>
        </nav>

        <div className={styles.userRow}>
          <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Log out">↩</button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

function stringToColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const h = hash % 360
  return `hsl(${h}, 60%, 55%)`
}
