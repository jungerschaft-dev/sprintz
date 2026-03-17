import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.ts'
import { AppLayout } from '@/components/layout/AppLayout.tsx'
import { LoginPage } from '@/pages/LoginPage.tsx'
import { RegisterPage } from '@/pages/RegisterPage.tsx'
import { ProjectsPage } from '@/pages/ProjectsPage.tsx'
import { ProjectPage } from '@/pages/ProjectPage.tsx'
import { SprintPage } from '@/pages/SprintPage.tsx'
import { CalendarPage } from '@/pages/CalendarPage.tsx'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectPage />} />
        <Route path="projects/:projectId/sprints/:sprintId" element={<SprintPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>
    </Routes>
  )
}
