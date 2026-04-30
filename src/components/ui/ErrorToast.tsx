import { useLoadingError } from '../../hooks/useLoadingError'

export function ErrorToast() {
  const { errors, clearError } = useLoadingError()

  if (errors.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" role="alert" aria-live="polite">
      {errors.map((entry) => (
        <div
          key={entry.id}
          className="flex max-w-sm items-start gap-3 rounded-xl border border-rose-500/40 bg-slate-900 p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4"
        >
          {/* Icon */}
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
            !
          </span>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <p className="text-sm text-slate-100">{entry.message}</p>

            <div className="flex gap-2">
              {entry.retry && (
                <button
                  className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-600"
                  onClick={() => {
                    clearError(entry.id)
                    entry.retry?.()
                  }}
                >
                  Reintentar
                </button>
              )}
              <button
                className="rounded-md px-3 py-1 text-xs text-slate-400 transition-colors hover:text-slate-200"
                onClick={() => clearError(entry.id)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
