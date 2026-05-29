import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { DiagramEditorPage } from './pages/DiagramEditorPage'
import { LoginPage } from './pages/LoginPage'
import { RequirementsPage } from './pages/RequirementsPage'
import { ValidationRulesPage } from './pages/ValidationRulesPage'
import { ProjectIsoRulesPage } from './pages/ProjectIsoRulesPage'
import { RegisterPage } from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage'
import { ProtectedRoute } from './router/ProtectedRoute'
import { PublicOnlyRoute } from './router/PublicOnlyRoute'
import { AppShell } from './components/layout/AppShell'
import { useTheme } from './hooks/useTheme'
import { useAuth } from './auth/useAuth'
import { useIdleLogout } from './hooks/useIdleLogout'
import { ProjectInfoPage } from './pages/ProjectInfoPage'
import { EditProjectPage } from './pages/EditProjectPage'
// ── Requirements navigation flow ──────────────────────────────────────────
import { RequirementTypeSelectionPage } from './pages/RequirementTypeSelectionPage'
import { FunctionalRequirementModePage } from './pages/FunctionalRequirementModePage'
import { RequirementAIPage } from './pages/RequirementAIPage'
import { FunctionalRequirementManualPage } from './pages/FunctionalRequirementManualPage'
import { NonFunctionalRequirementModePage } from './pages/NonFunctionalRequirementModePage'
import { NonFunctionalRequirementManualPage } from './pages/NonFunctionalRequirementManualPage'
import { ProjectDiagramsPage } from './pages/ProjectDiagramsPage'
import { DiagramTypeDetailPage } from './pages/DiagramTypeDetailPage'
import { ProjectMapPage } from './pages/ProjectMapPage'
import ProjectReportsPage from './pages/ProjectReportsPage'
import { PlaybackWorkshopPage } from './pages/PlaybackWorkshopPage'

function App() {
  useTheme()
  const { isAuthenticated, logout } = useAuth()

  useIdleLogout({
    isAuthenticated,
    timeoutMs: 15 * 60 * 1000, // 15 minutes
    onIdle: () => {
      logout()
      window.alert('Sesión cerrada por inactividad.')
    }
  })

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

        {/* Project Settings */}
        <Route path="/app/projects/:projectId/info" element={<AppShell hideSidebar><ProjectInfoPage /></AppShell>} />
        <Route path="/app/projects/:projectId/edit" element={<AppShell hideSidebar><EditProjectPage /></AppShell>} />

        {/* Project ISO Rules Setup - Step after project creation */}
        <Route path="/app/projects/:projectId/iso-rules" element={
          <AppShell hideSidebar><ProjectIsoRulesPage /></AppShell>
        } />

        {/* ── Requirements navigation flow ────────────────────────────────── */}
        {/* Step 1: type selector (functional / non-functional) */}
        <Route path="/app/projects/:projectId/requirements" element={
          <AppShell hideSidebar><RequirementTypeSelectionPage /></AppShell>
        } />

        {/* Step 2a: functional mode selector (AI / manual) */}
        <Route path="/app/projects/:projectId/requirements/functional" element={
          <AppShell hideSidebar><FunctionalRequirementModePage /></AppShell>
        } />

        {/* Step 3a-i: functional AI creation */}
        <Route path="/app/projects/:projectId/requirements/functional/ai" element={
          <AppShell hideSidebar><RequirementAIPage requirementType="FUNCTIONAL" /></AppShell>
        } />

        {/* Step 3a-ii: functional manual management */}
        <Route path="/app/projects/:projectId/requirements/functional/manual" element={
          <AppShell hideSidebar><FunctionalRequirementManualPage /></AppShell>
        } />

        {/* Step 2b: non-functional mode selector (AI / manual) */}
        <Route path="/app/projects/:projectId/requirements/non-functional" element={
          <AppShell hideSidebar><NonFunctionalRequirementModePage /></AppShell>
        } />

        {/* Step 3b-i: non-functional AI creation */}
        <Route path="/app/projects/:projectId/requirements/non-functional/ai" element={
          <AppShell hideSidebar><RequirementAIPage requirementType="NON_FUNCTIONAL" /></AppShell>
        } />

        {/* Step 3b-ii: non-functional manual management */}
        <Route path="/app/projects/:projectId/requirements/non-functional/manual" element={
          <AppShell hideSidebar><NonFunctionalRequirementManualPage /></AppShell>
        } />

        {/* Legacy requirements route — redirects to new type selector */}
        <Route path="/app/projects/:projectId/requirements/legacy" element={
          <AppShell hideSidebar><RequirementsPage /></AppShell>
        } />

        {/* Global Project Map */}
        <Route path="/app/projects/:projectId/requirements/map" element={
          <AppShell hideSidebar><ProjectMapPage /></AppShell>
        } />

        {/* ── Diagrams navigation flow ────────────────────────────────── */}
        <Route path="/app/projects/:projectId/diagrams" element={
          <AppShell hideSidebar><ProjectDiagramsPage /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/class" element={
          <AppShell hideSidebar><DiagramTypeDetailPage type="CLASS" /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/use-case" element={
          <AppShell hideSidebar><DiagramTypeDetailPage type="USE_CASE" /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/sequence" element={
          <AppShell hideSidebar><DiagramTypeDetailPage type="SEQUENCE" /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/activity" element={
          <AppShell hideSidebar><DiagramTypeDetailPage type="ACTIVITY" /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/component" element={
          <AppShell hideSidebar><DiagramTypeDetailPage type="COMPONENT" /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/er" element={
          <AppShell hideSidebar><DiagramTypeDetailPage type="ER" /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/:diagramTypePath/new" element={
          <AppShell hideSidebar><DiagramEditorPage /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/:diagramTypePath/:diagramId" element={
          <AppShell hideSidebar><DiagramEditorPage /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/:diagramId" element={
          <AppShell hideSidebar><DiagramEditorPage /></AppShell>
        } />
        <Route path="/app/projects/:projectId/diagrams/new" element={
          <AppShell hideSidebar><DiagramEditorPage /></AppShell>
        } />
        <Route path="/app/projects/:projectId/validation-rules" element={<AppShell hideSidebar><ValidationRulesPage /></AppShell>} />
        <Route path="/app/projects/:projectId/reports" element={<AppShell><ProjectReportsPage /></AppShell>} />

        {/* Global Playback Workshop */}
        <Route path="/app/playback-workshop" element={<AppShell hideSidebar><PlaybackWorkshopPage /></AppShell>} />

        {/* Legacy / Direct access */}
        <Route path="/app/projects" element={<Navigate to="/app" replace />} />
        <Route path="/app/requirements" element={<AppShell><RequirementsPage /></AppShell>} />
        <Route path="/app/diagrams" element={<AppShell><DiagramEditorPage /></AppShell>} />
        <Route path="/app/validation-rules" element={<AppShell hideSidebar><ValidationRulesPage /></AppShell>} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
