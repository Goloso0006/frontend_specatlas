import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import { LoadingErrorProvider } from './context/LoadingErrorProvider'
import { LoadingOverlay } from './components/ui/LoadingOverlay'
import { ErrorToast } from './components/ui/ErrorToast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <LoadingErrorProvider>
            <App />
            <LoadingOverlay />
            <ErrorToast />
          </LoadingErrorProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
