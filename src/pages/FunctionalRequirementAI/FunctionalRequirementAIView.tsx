import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProject, isValidProjectId } from '../../context/ProjectContext'
import { useApiOperation } from '../../hooks/useLoadingError'
import { requirementFacade } from '../../facades/requirement.facade'
import { NoProjectSelected } from '../../components/ui/NoProjectSelected'
import type { RequirementDTO } from '../../types/requirements'
import { GenerationResult } from './GenerationResult'
import { AI_INPUT_CLASSNAME } from './FunctionalRequirementAIStyles'

export function FunctionalRequirementAIPage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const navigate = useNavigate()
  const { run, isLoading } = useApiOperation()

  const projectId = routeProjectId ?? contextProjectId ?? ''
  const [inputText, setInputText] = useState('')
  const [generatedResult, setGeneratedResult] = useState<RequirementDTO | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para usar la generación con IA." />
  }

  async function handleGenerate() {
    if (!inputText.trim()) return
    setGeneratedResult(null)
    setSavedMessage(null)

    const data = await run(
      () => requirementFacade.convertTextToRequirement(projectId, inputText.trim()),
      { errorMessage: 'Error al generar el requisito con IA.' },
    )

    if (data) setGeneratedResult({ ...data, projectId })
  }

  async function handleSave() {
    if (!generatedResult) return
    setIsSaving(true)

    const saved = await run(
      () => requirementFacade.saveRequirement({ ...generatedResult, projectId }),
      { errorMessage: 'Error al guardar el requisito.' },
    )

    setIsSaving(false)

    if (saved) {
      setSavedMessage(`Requisito "${saved.title}" guardado correctamente.`)
      setGeneratedResult(null)
      setInputText('')
    }
  }

  function handleDiscard() {
    setGeneratedResult(null)
    setSavedMessage(null)
  }

  const canGenerate = inputText.trim().length > 0 && !isLoading

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 pt-12 pb-20">
        <div className="mb-8">
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--color-accent)]">
            // ia · requisitos funcionales
          </span>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Crear con IA
          </h1>
          <p className="mt-2.5 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            Pega notas de reunión, correos, conversaciones con el cliente u otro texto libre.
            SpecAtlas generará un requisito estructurado en segundos.
          </p>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Texto de entrada</span>
            {inputText.trim().length > 0 && (
              <span className="text-[11px] text-[var(--color-text-muted)]">{inputText.trim().length} caracteres</span>
            )}
          </div>
          <div className="p-5">
            <textarea
              id="ai-input-text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Ejemplo: El cliente mencionó que necesita que el sistema envíe una notificación por email cuando un pedido cambia de estado. Esto aplica para todos los usuarios registrados. También es importante que llegue en menos de 5 minutos…"
              rows={10}
              className={`${AI_INPUT_CLASSNAME} resize-y min-h-[180px]`}
            />
            <p className="mt-2 text-[11.5px] text-[var(--color-text-muted)] leading-relaxed">
              Acepta notas de reunión, correos, conversaciones de chat, descripciones informales u otro texto libre. No es necesario que el texto esté estructurado.
            </p>
          </div>
          <div className="px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3">
            <span className="text-[11.5px] text-[var(--color-text-muted)]">
              El requisito generado aparecerá abajo para revisión antes de guardar.
            </span>
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
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generando…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generar requisito con IA
                </>
              )}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[12.5px] text-[var(--color-text-muted)] mb-5">
            <div className="w-3.5 h-3.5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Procesando con IA… esto puede tomar unos segundos. Si el servidor está iniciando, puede demorar un poco más.
          </div>
        )}

        {savedMessage && !generatedResult && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] text-[var(--color-text-primary)] mb-5">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {savedMessage}
            <button
              type="button"
              onClick={() => navigate(`/app/projects/${projectId}/requirements/functional/manual`)}
              className="ml-auto text-[var(--color-accent)] hover:underline text-[12px] font-medium"
            >
              Ver lista de requisitos →
            </button>
          </div>
        )}

        {generatedResult && (
          <GenerationResult
            result={generatedResult}
            isSaving={isSaving}
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
        )}
      </div>
    </div>
  )
}

export default FunctionalRequirementAIPage