import type { RequirementDTO } from '../../types/requirements'

interface GenerationResultProps {
  result: RequirementDTO
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}

export function GenerationResult({ result, isSaving, onSave, onDiscard }: GenerationResultProps) {
  return (
    <div
      className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] overflow-hidden"
      style={{ animation: 'slideUp 280ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <style>{`\
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            Requisito generado
          </span>
        </div>
        {result.code && (
          <span className="inline-flex items-center h-5 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)] text-[var(--color-accent-foreground)]">
            {result.code}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Título</p>
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)] leading-snug">{result.title || '—'}</p>
        </div>

        {result.description && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Descripción</p>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{result.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.actors && result.actors.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Actores</p>
              <div className="flex flex-wrap gap-1.5">
                {result.actors.map((actor) => (
                  <span key={actor} className="inline-flex items-center h-5 px-2 rounded-md text-[11px] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.isoClassification && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Clasificación ISO</p>
              <span className="inline-flex items-center h-5 px-2 rounded-md text-[11px] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                {result.isoClassification}
              </span>
            </div>
          )}
        </div>

        {result.acceptanceCriteria && result.acceptanceCriteria.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Criterios de aceptación (BDD)</p>
            <ul className="space-y-1.5">
              {result.acceptanceCriteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2 text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.relatedCodes && result.relatedCodes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Requisitos relacionados</p>
            <div className="flex flex-wrap gap-1.5">
              {result.relatedCodes.map((code) => (
                <span key={code} className="inline-flex items-center h-5 px-2 rounded-md text-[11px] font-mono font-medium bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={onDiscard}
          className={[
            'h-8 px-4 rounded-lg text-[12.5px] font-medium',
            'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-bg-card)] transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          ].join(' ')}
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={[
            'h-8 px-4 rounded-lg text-[12.5px] font-semibold',
            'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
            'hover:opacity-90 transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
          ].join(' ')}
        >
          {isSaving
            ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Guardando…</span>
            : 'Guardar requisito'
          }
        </button>
      </div>
    </div>
  )
}

export default GenerationResult