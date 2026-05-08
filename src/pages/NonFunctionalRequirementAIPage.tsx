import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { requirementFacade } from '../facades/requirement.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import type { RequirementDTO } from '../types/requirements'

const inputCls = [
  'w-full px-3 py-2 text-[13px] rounded-lg',
  'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
  'transition-all duration-150',
].join(' ')

interface GenerationResultProps {
  result: RequirementDTO
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}

function GenerationResult({ result, isSaving, onSave, onDiscard }: GenerationResultProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] overflow-hidden"
      style={{ animation: 'slideUp 280ms cubic-bezier(0.16,1,0.3,1) both' }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">RNF generado</span>
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
                {result.actors.map((a) => (
                  <span key={a} className="inline-flex items-center h-5 px-2 rounded-md text-[11px] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">{a}</span>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Criterios de aceptación</p>
            <ul className="space-y-1.5">
              {result.acceptanceCriteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <button type="button" onClick={onDiscard}
          className="h-8 px-4 rounded-lg text-[12.5px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">
          Descartar
        </button>
        <button type="button" onClick={onSave} disabled={isSaving}
          className="h-8 px-4 rounded-lg text-[12.5px] font-semibold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
          {isSaving
            ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Guardando…</span>
            : 'Guardar RNF'}
        </button>
      </div>
    </div>
  )
}

export function NonFunctionalRequirementAIPage() {
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
      { errorMessage: 'Error al generar el RNF con IA.' }
    )
    if (data) setGeneratedResult({ ...data, projectId })
  }

  async function handleSave() {
    if (!generatedResult) return
    setIsSaving(true)
    const saved = await run(
      () => requirementFacade.saveRequirement({ ...generatedResult, projectId }),
      { errorMessage: 'Error al guardar el RNF.' }
    )
    setIsSaving(false)
    if (saved) {
      setSavedMessage(`Requisito "${saved.title}" guardado correctamente.`)
      setGeneratedResult(null)
      setInputText('')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 pt-12 pb-20">

        <div className="mb-8">
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--color-accent)]">
            // ia · requisitos no funcionales
          </span>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Crear RNF con IA
          </h1>
          <p className="mt-2.5 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            Pega especificaciones técnicas, restricciones o notas sobre calidad, seguridad, rendimiento o usabilidad.
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
              id="rnf-ai-input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ejemplo: El sistema debe responder en menos de 2 segundos ante cualquier petición bajo carga normal. La disponibilidad mínima esperada es del 99.5%…"
              rows={10}
              className={`${inputCls} resize-y min-h-[180px]`}
            />
          </div>
          <div className="px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-end gap-3">
            <button
              type="button"
              id="btn-generate-rnf-ai"
              onClick={handleGenerate}
              disabled={!inputText.trim() || isLoading}
              className="flex-shrink-0 inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              {isLoading ? (
                <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Generando…</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Generar RNF con IA</>
              )}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[12.5px] text-[var(--color-text-muted)] mb-5">
            <div className="w-3.5 h-3.5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Procesando con IA…
          </div>
        )}

        {savedMessage && !generatedResult && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] text-[var(--color-text-primary)] mb-5">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {savedMessage}
            <button type="button"
              onClick={() => navigate(`/app/projects/${projectId}/requirements/non-functional/manual`)}
              className="ml-auto text-[var(--color-accent)] hover:underline text-[12px] font-medium">
              Ver lista de RNF →
            </button>
          </div>
        )}

        {generatedResult && (
          <GenerationResult
            result={generatedResult}
            isSaving={isSaving}
            onSave={handleSave}
            onDiscard={() => { setGeneratedResult(null); setSavedMessage(null) }}
          />
        )}


      </div>
    </div>
  )
}

export default NonFunctionalRequirementAIPage
