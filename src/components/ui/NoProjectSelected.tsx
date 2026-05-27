import { useNavigate } from 'react-router-dom'
import { Card } from './Card'
import { Button } from './Button'
import { useSmartNavigate } from '../../hooks/useSmartNavigate'

interface NoProjectSelectedProps {
  /** Optional custom message */
  message?: string
}

/**
 * Rendered when a page that requires a projectId is visited
 * without one. Prompts the user to select a project from the dashboard.
 */
export function NoProjectSelected({ message }: NoProjectSelectedProps) {
  const smartNavigate = useSmartNavigate()

  return (
    <Card className="py-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <div className="w-14 h-14 bg-app-surface rounded-full flex items-center justify-center mb-5">
        <span className="text-2xl">📂</span>
      </div>
      <h2 className="text-xl font-semibold app-text-primary mb-2">
        Selecciona un proyecto para continuar
      </h2>
      <p className="app-text-secondary text-[15px] max-w-md mb-6">
        {message ?? 'Para acceder a este módulo necesitas seleccionar un proyecto desde el dashboard o la lista de proyectos.'}
      </p>
      <Button onClick={() => smartNavigate('/app')}>
        Ir al Dashboard
      </Button>
    </Card>
  )
}
