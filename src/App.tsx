import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { DiagramEditorPage } from './pages/DiagramEditorPage'
import { LoginPage } from './pages/LoginPage'
import { RequirementsPage } from './pages/RequirementsPage'
import { ValidationRulesPage } from './pages/ValidationRulesPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage'
import { ProtectedRoute } from './router/ProtectedRoute'
import { PublicOnlyRoute } from './router/PublicOnlyRoute'
import { AppShell } from './components/layout/AppShell'
import { useTheme } from './hooks/useTheme'
import { ProjectInfoPage } from './pages/ProjectInfoPage'
import { EditProjectPage } from './pages/EditProjectPage'

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
        {/* Home / Projects List - No Sidebar */}
        <Route path="/app" element={<AppShell hideSidebar><DashboardPage /></AppShell>} />
        
        {/* Project Hub - No Sidebar */}
        <Route path="/app/projects/:projectId" element={<AppShell hideSidebar><ProjectWorkspacePage /></AppShell>} />

        {/* Project Settings/Info - These could also be sidebar-less or with sidebar. 
            User says "En esa pantalla [hub] debe existir un botón con icono de engranaje... abre menú desplegable".
            I'll make the Info, Edit, Rules pages have sidebar to maintain consistency with internal tools, 
            or keep them clean too. Let's make them clean (no sidebar) for a "focused" experience.
        */}
        <Route path="/app/projects/:projectId/info" element={<AppShell hideSidebar><ProjectInfoPage /></AppShell>} />
        <Route path="/app/projects/:projectId/edit" element={<AppShell hideSidebar><EditProjectPage /></AppShell>} />
        
        {/* Internal Project Tools - With Sidebar */}
        <Route path="/app/projects/:projectId/requirements" element={<AppShell><RequirementsPage /></AppShell>} />
        <Route path="/app/projects/:projectId/diagrams" element={<AppShell><DiagramEditorPage /></AppShell>} />
        <Route path="/app/projects/:projectId/validation-rules" element={<AppShell><ValidationRulesPage /></AppShell>} />

        {/* Legacy / Direct access */}
        <Route path="/app/projects" element={<Navigate to="/app" replace />} />
        <Route path="/app/requirements" element={<AppShell><RequirementsPage /></AppShell>} />
        <Route path="/app/diagrams" element={<AppShell><DiagramEditorPage /></AppShell>} />
        <Route path="/app/validation-rules" element={<AppShell><ValidationRulesPage /></AppShell>} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App