import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { LoadingErrorProvider } from './context/LoadingErrorProvider'
import { LoadingOverlay } from './components/ui/LoadingOverlay'
import { ErrorToast } from './components/ui/ErrorToast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LoadingErrorProvider>
          <App />
          <LoadingOverlay />
          <ErrorToast />
        </LoadingErrorProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
