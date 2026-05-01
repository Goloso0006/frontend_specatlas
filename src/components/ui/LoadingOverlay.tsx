import { useLoadingError } from '../../hooks/useLoadingError'

export function LoadingOverlay() {
  const { isLoading } = useLoadingError()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center app-bg/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border app-border-strong app-card px-8 py-6 shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 app-border-strong border-t-app-accent" />
        <p className="text-sm font-medium app-text-secondary">Procesando…</p>
      </div>
    </div>
  )
}
