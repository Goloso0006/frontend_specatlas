import { useLoadingError } from '../../hooks/useLoadingError'

export function LoadingOverlay() {
  const { isLoading } = useLoadingError()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 px-8 py-6 shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-cyan-400" />
        <p className="text-sm font-medium text-slate-300">Procesando…</p>
      </div>
    </div>
  )
}
