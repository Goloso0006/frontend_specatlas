import { useParams } from 'react-router-dom'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { RequirementDraftItem } from '../components/requirements/RequirementDraftItem'
import { useRequirementAI, MIN_TEXT_LENGTH, type RequirementType } from '../hooks/useRequirementAI'

interface RequirementAIPageProps {
  requirementType: RequirementType
}

function typeLabel(type: RequirementType): string {
  return type === 'FUNCTIONAL' ? 'funcional' : 'no funcional'
}

function eyebrowLabel(type: RequirementType): string {
  return type === 'FUNCTIONAL'
    ? '// ia · requisitos funcionales (batch)'
    : '// ia · requisitos no funcionales (batch)'
}

const textareaCls = [
  'w-full px-3 py-2 text-[13px] rounded-lg',
  'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
  'transition-all duration-150 resize-y min-h-[180px]',
].join(' ')

export function RequirementAIPage({ requirementType }: RequirementAIPageProps) {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const projectId = routeProjectId ?? contextProjectId ?? ''

  const {
    inputText,
    setInputText,
    drafts,
    updateDraft,
    sourceSummary,
    warnings,
    isSavingBatch,
    saveProgress,
    batchSuccessMessage,
    quotaCountdown,
    quotaErrorMessage,
    isGenerating,
    handleGenerate,
    handleSaveSelected,
    handleRequirementChange,
    handleRecheckDuplicates,
    selectedCount,
    canGenerate,
  } = useRequirementAI(projectId, requirementType)

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para usar la generación con IA." />
  }

  if (projectId.startsWith('USR-')) {
    return <NoProjectSelected message="El ID detectado corresponde a un usuario, no a un proyecto. Por favor selecciona un proyecto válido." />
  }

  const label = typeLabel(requirementType)

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 pt-12 pb-20 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div>
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {eyebrowLabel(requirementType)}
          </span>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Crear propuestas con IA
          </h1>
          <p className="mt-2.5 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            Pega notas, correos o conversaciones y SpecAtlas generará propuestas revisables de requisitos {label}es.
            La IA no guarda nada automáticamente.
          </p>
        </div>

        {/* ── Text input card ────────────────────────────────────────── */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              Texto de entrada
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {inputText.trim().length > 0
                ? `${inputText.trim().length} caracteres${inputText.trim().length < MIN_TEXT_LENGTH ? ` (mín. ${MIN_TEXT_LENGTH})` : ''}`
                : `Mín. ${MIN_TEXT_LENGTH} caracteres`
              }
            </span>
          </div>
          <div className="p-5">
            <textarea
              id="ai-input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Pega aquí el texto de reunión, correo, conversación o documento...\n\nEjemplo: "El cliente necesita notificaciones por email al cambiar estado. Debe llegar en menos de 5 min."`}
              rows={8}
              disabled={isGenerating || isSavingBatch}
              className={textareaCls}
            />
          </div>
          <div className="px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3">
            <p className="text-[11.5px] text-[var(--color-text-muted)] leading-relaxed max-w-xs">
              La IA generará múltiples propuestas si detecta varios requisitos.
            </p>
            <button
              type="button"
              id="btn-generate-ai"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={[
                'flex-shrink-0 inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold',
                'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
                'hover:opacity-90 transition-all duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
              ].join(' ')}
            >
              {isGenerating ? (
                <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generando…</>
              ) : quotaCountdown > 0 ? (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Espera {quotaCountdown}s</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Generar propuestas</>
              )}
            </button>
          </div>
        </div>

        {/* ── Status Messages ─────────────────────────────────────────── */}
        {isGenerating && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[12.5px] text-[var(--color-text-muted)]">
            <div className="w-3.5 h-3.5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Analizando documento y extrayendo requisitos...
          </div>
        )}

        {isSavingBatch && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50/10 border border-blue-400/30 text-[12.5px] text-blue-400">
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            {saveProgress}
          </div>
        )}

        {batchSuccessMessage && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-400/30 bg-emerald-50/10 dark:bg-emerald-900/10 text-[13px] text-[var(--color-text-primary)]">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{batchSuccessMessage}</span>
          </div>
        )}

        {quotaErrorMessage && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-rose-400/30 bg-rose-50/10 dark:bg-rose-900/10 space-y-1">
            <svg className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-rose-600 dark:text-rose-400">Límite de API alcanzado</p>
              <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                {quotaErrorMessage}
              </p>
              {quotaCountdown > 0 && (
                <p className="text-[12px] font-medium text-rose-500 mt-1.5">
                  Puedes intentar nuevamente en {quotaCountdown} segundos.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Warnings & Source Summary ───────────────────────────────── */}
        {warnings.length > 0 && (
          <div className="px-4 py-3 rounded-xl border border-amber-400/30 bg-amber-50/10 dark:bg-amber-900/10 space-y-1">
            <p className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 mb-1">Advertencias de la IA:</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-[12px] text-[var(--color-text-muted)] flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                {w}
              </p>
            ))}
          </div>
        )}

        {sourceSummary && (
          <div className="px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Resumen del texto</p>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed italic">
              "{sourceSummary}"
            </p>
          </div>
        )}

        {/* ── Generated Drafts List ───────────────────────────────────── */}
        {drafts.some(d => !d.discarded) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mt-8 border-b border-[var(--color-border)] pb-2">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Propuestas</h2>
              <button
                type="button"
                onClick={handleSaveSelected}
                disabled={selectedCount === 0 || isSavingBatch}
                className={[
                  'h-8 px-4 rounded-lg text-[12.5px] font-semibold',
                  'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
                  'hover:opacity-90 transition-all duration-150',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                Guardar seleccionados ({selectedCount})
              </button>
            </div>

            {drafts.filter(d => !d.discarded).map((item) => (
              <RequirementDraftItem
                key={item.draftId}
                item={item}
                requirementType={requirementType}
                onUpdateDraft={updateDraft}
                onChangeRequirement={handleRequirementChange}
                onRecheckDuplicates={handleRecheckDuplicates}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RequirementAIPage
