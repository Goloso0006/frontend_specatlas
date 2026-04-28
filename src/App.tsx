import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { DiagramEditorPage } from './pages/DiagramEditorPage'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { RequirementsPage } from './pages/RequirementsPage'
import { ValidationRulesPage } from './pages/ValidationRulesPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProtectedRoute } from './router/ProtectedRoute'
import { PublicOnlyRoute } from './router/PublicOnlyRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/diagrams" element={<DiagramEditorPage />} />
        <Route path="/app/projects" element={<ProjectsPage />} />
        <Route path="/app/requirements" element={<RequirementsPage />} />
        <Route path="/app/validation-rules" element={<ValidationRulesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App