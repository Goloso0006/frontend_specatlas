import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class DiagramErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Diagram Error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-app-bg p-8">
          <div className="text-center p-10 bg-white dark:bg-[#181818] rounded-3xl border border-rose-200 dark:border-rose-900/30 shadow-xl max-w-lg">
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-app-text-primary mb-4">Error en el Editor</h2>
            <p className="text-app-text-secondary mb-8 leading-relaxed">
              No fue posible cargar el editor de diagramas debido a una inconsistencia en los datos o un error interno. 
              Por favor, intenta recargar la página o volver a la biblioteca de diagramas.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>Recargar</Button>
              <Button variant="secondary" onClick={() => window.history.back()}>Volver</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
