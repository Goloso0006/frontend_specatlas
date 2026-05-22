import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { requirementFacade } from '../facades/requirement.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import type { RequirementDTO } from '../types/requirements'

const inputCls = [
  'w-full px-3 py-2 text-[13px] rounded-lg',
  'bg-[var(--color-bg)] border border border-[var(--color-border-strong)]',
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
    <div
      className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{ animation: 'slideUp 280ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            Requisito No Funcional Detectado
          </span>
        </div>
        {result.code && (
          <span className="inline-flex items-center h-5 px-2 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--color-accent)] text-[var(--color-accent-foreground)]">
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

        {/* Detalle de Requisito No Funcional Completo */}
        {result.nonFunctionalDetail && (
          <div className="p-4 bg-[var(--color-surface)]/60 rounded-xl border border-[var(--color-border)] space-y-3.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent)] flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              Detalles Métricos (ISO 25010)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Categoría ISO</p>
                <p className="text-[12.5px] font-medium text-[var(--color-text-primary)]">{result.nonFunctionalDetail.category || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Métrica</p>
                <p className="text-[12.5px] font-medium text-[var(--color-text-primary)]">{result.nonFunctionalDetail.metricName || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Valor Objetivo</p>
                <p className="text-[12.5px] font-mono font-medium text-[var(--color-text-primary)]">
                  {result.nonFunctionalDetail.operator || ''} {result.nonFunctionalDetail.targetValue || '—'} {result.nonFunctionalDetail.unit || ''}
                </p>
              </div>
              {result.nonFunctionalDetail.verificationMethod && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Método de Verificación</p>
                  <p className="text-[12.5px] font-medium text-[var(--color-text-primary)]">{result.nonFunctionalDetail.verificationMethod}</p>
                </div>
              )}
              {result.nonFunctionalDetail.context && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Contexto de Aplicación</p>
                  <p className="text-[12.5px] font-medium text-[var(--color-text-secondary)] italic">"{result.nonFunctionalDetail.context}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {result.acceptanceCriteria && result.acceptanceCriteria.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Criterios de Aceptación</p>
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
      </div>

      <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={onDiscard}
          className="h-8 px-4 rounded-lg text-[12.5px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] transition-all duration-150"
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="h-8 px-4 rounded-lg text-[12.5px] font-semibold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              Guardando…
            </span>
          ) : (
            'Guardar RNF'
          )}
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
  const [generatedRequirements, setGeneratedRequirements] = useState<RequirementDTO[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para usar la generación con IA." />
  }

  async function handleGenerate() {
    if (!inputText.trim()) return
    setGeneratedRequirements([])
    setSavedMessage(null)

    console.log('[AI_RNF] Paste text request trigger. length:', inputText.length)

    const response: any = await run(
      () => requirementFacade.convertTextToRequirement(projectId, inputText.trim()),
      { errorMessage: 'Error al generar el RNF con IA.' }
    )

    console.log('[AI_RNF] Raw API response payload:', response)

    const rawRequirements = response?.requirements ?? (response ? [response] : [])

    if (response?.requirements) {
      console.table(response.requirements.map((r: any) => ({ rawCode: r.code, title: r.title })));
    }

    const normalizedRequirements = rawRequirements.map((req: any) => ({
      id: req.id ?? crypto.randomUUID(),
      code: req.code ?? "",
      title: req.title ?? "",
      description: req.description ?? "",
      actors: req.actors ?? [],
      acceptanceCriteria: req.acceptanceCriteria ?? [],
      isoClassification: req.isoClassification ?? "",
      requirementType: req.requirementType ?? "NON_FUNCTIONAL",
      projectId: req.projectId ?? projectId,
      relatedCodes: req.relatedCodes ?? [],
      nonFunctionalDetail:
        (req.requirementType === "NON_FUNCTIONAL" || req.nonFunctionalDetail)
          ? {
              category: req.nonFunctionalDetail?.category ?? "",
              metricName: req.nonFunctionalDetail?.metricName ?? "",
              operator: req.nonFunctionalDetail?.operator ?? "",
              targetValue: req.nonFunctionalDetail?.targetValue ?? "",
              unit: req.nonFunctionalDetail?.unit ?? "",
              context: req.nonFunctionalDetail?.context ?? "",
              verificationMethod: req.nonFunctionalDetail?.verificationMethod ?? "",
              rationale: req.nonFunctionalDetail?.rationale ?? "",
            }
          : null,
    }));

    console.table(normalizedRequirements.map((r: any) => ({ normalizedCode: r.code, title: r.title })));

    console.log("[AI_GENERATED_REQUIREMENTS] total:", normalizedRequirements.length);
    console.table(
      normalizedRequirements.map((r: any) => ({
        code: r.code,
        type: r.requirementType,
        hasNfrDetail: !!r.nonFunctionalDetail,
        category: r.nonFunctionalDetail?.category,
        metricName: r.nonFunctionalDetail?.metricName,
        operator: r.nonFunctionalDetail?.operator,
        targetValue: r.nonFunctionalDetail?.targetValue,
        unit: r.nonFunctionalDetail?.unit,
        verificationMethod: r.nonFunctionalDetail?.verificationMethod,
      }))
    );

    setGeneratedRequirements(normalizedRequirements)
  }

  async function handleSaveSingle(index: number) {
    const requirement = generatedRequirements[index]
    if (!requirement) return
    setIsSaving(true)

    const payload = {
      projectId,
      code: requirement.code ?? "",
      title: requirement.title,
      description: requirement.description,
      actors: requirement.actors ?? [],
      acceptanceCriteria: requirement.acceptanceCriteria ?? [],
      isoClassification: requirement.isoClassification,
      requirementType: requirement.requirementType,
      relatedCodes: requirement.relatedCodes ?? [],
      nonFunctionalDetail:
        requirement.requirementType === "NON_FUNCTIONAL"
          ? {
              category: requirement.nonFunctionalDetail?.category,
              metricName: requirement.nonFunctionalDetail?.metricName,
              operator: requirement.nonFunctionalDetail?.operator,
              targetValue: requirement.nonFunctionalDetail?.targetValue,
              unit: requirement.nonFunctionalDetail?.unit,
              context: requirement.nonFunctionalDetail?.context,
              verificationMethod: requirement.nonFunctionalDetail?.verificationMethod,
              rationale: requirement.nonFunctionalDetail?.rationale,
            }
          : null,
    };

    console.log("[REQUIREMENT_SAVE_PAYLOAD]", payload);

    const saved = await run(
      () => requirementFacade.saveRequirement(payload as any),
      { errorMessage: 'Error al guardar el RNF.' }
    )

    setIsSaving(false)

    if (saved) {
      setGeneratedRequirements(prev => prev.filter((_, i) => i !== index))
      setSavedMessage(`Requisito "${saved.title}" guardado correctamente.`)
    }
  }

  function handleDiscardSingle(index: number) {
    setGeneratedRequirements(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto w-full px-6 md:px-8 pt-12 pb-20">
        <div className="mb-8">
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--color-accent)]">
            // ia · requisitos no funcionales (batch)
          </span>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Crear RNF con IA
          </h1>
          <p className="mt-2.5 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            Pega especificaciones técnicas, restricciones o notas sobre calidad, seguridad, rendimiento o usabilidad.
            La IA estructurará y presentará todos los requisitos detectados como tarjetas independientes.
          </p>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Texto de entrada</span>
            {inputText.trim().length > 0 && (
              <span className="text-[11px] text-[var(--color-text-muted)]">{inputText.trim().length} caracteres (max. 5000)</span>
            )}
          </div>
          <div className="p-5">
            <textarea
              id="rnf-ai-input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 5000))}
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
              disabled={!(inputText.trim().length >= 20 && inputText.trim().length <= 5000) || isLoading}
              className="flex-shrink-0 inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  Generar RNF con IA
                </>
              )}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[12.5px] text-[var(--color-text-muted)] mb-5">
            <div className="w-3.5 h-3.5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Procesando con IA… esto puede demorar unos segundos.
          </div>
        )}

        {savedMessage && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] text-[var(--color-text-primary)] mb-5">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {savedMessage}
            <button
              type="button"
              onClick={() => navigate(`/app/projects/${projectId}/requirements/non-functional/manual`)}
              className="ml-auto text-[var(--color-accent)] hover:underline text-[12px] font-medium"
            >
              Ver lista de RNF →
            </button>
          </div>
        )}

        {generatedRequirements.length > 0 && (
          <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Propuestas Generadas ({generatedRequirements.length})
              </h2>
              <button
                type="button"
                onClick={() => setGeneratedRequirements([])}
                className="text-xs text-[var(--color-text-muted)] hover:text-rose-500 font-medium transition-colors"
              >
                Descartar todas
              </button>
            </div>
            {generatedRequirements.map((req, idx) => (
              <GenerationResult
                key={idx}
                result={req}
                isSaving={isSaving}
                onSave={() => handleSaveSingle(idx)}
                onDiscard={() => handleDiscardSingle(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NonFunctionalRequirementAIPage
