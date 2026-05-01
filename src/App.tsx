import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { DiagramEditorPage } from './pages/DiagramEditorPage'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { RequirementsPage } from './pages/RequirementsPage'
import { ValidationRulesPage } from './pages/ValidationRulesPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { ProtectedRoute } from './router/ProtectedRoute'
import { PublicOnlyRoute } from './router/PublicOnlyRoute'
import { AppShell } from './components/layout/AppShell'
import { useTheme } from './hooks/useTheme'

function App() {
  useTheme()
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell><DashboardPage /></AppShell>} />
        <Route path="/app/diagrams" element={<AppShell><DiagramEditorPage /></AppShell>} />
        <Route path="/app/projects" element={<AppShell><ProjectsPage /></AppShell>} />
        <Route path="/app/requirements" element={<AppShell><RequirementsPage /></AppShell>} />
        <Route path="/app/validation-rules" element={<AppShell><ValidationRulesPage /></AppShell>} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App