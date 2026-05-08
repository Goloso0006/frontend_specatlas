/**
 * RequirementAIPage
 *
 * Generic AI-creation page parametrised by requirement type (FUNCTIONAL | NON_FUNCTIONAL).
 * Uses the batch endpoint (/api/requirements/convert-batch) to generate multiple drafts.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { requirementFacade } from '../facades/requirement.facade'
import { useLoadingError } from '../hooks/useLoadingError'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { RequirementDraftEditor } from '../components/requirements/RequirementDraftEditor'
import { DuplicateWarningPanel, type DuplicateCheckState } from '../components/requirements/DuplicateWarningPanel'
import type { RequirementDTO } from '../types/requirements'

// ── Types ─────────────────────────────────────────────────────────────────

type RequirementType = 'FUNCTIONAL' | 'NON_FUNCTIONAL'

interface RequirementAIPageProps {
  requirementType: RequirementType
}

interface RequirementDraft {
  draftId: string
  requirement: RequirementDTO
  selected: boolean
  discarded: boolean
  isEditing: boolean
  duplicateState: DuplicateCheckState
  duplicateConfirmed: boolean
  validationErrors: string[]
  validationWarnings: string[]
  classificationWarningConfirmed: boolean
  backendError?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────

function typeLabel(type: RequirementType): string {
  return type === 'FUNCTIONAL' ? 'funcional' : 'no funcional'
}

function eyebrowLabel(type: RequirementType): string {
  return type === 'FUNCTIONAL'
    ? '// ia · requisitos funcionales (batch)'
    : '// ia · requisitos no funcionales (batch)'
}

function manualPath(projectId: string, type: RequirementType): string {
  return type === 'FUNCTIONAL'
    ? `/app/projects/${projectId}/requirements/functional/manual`
    : `/app/projects/${projectId}/requirements/non-functional/manual`
}

import { validateRequirementBeforeSave } from '../utils/requirementValidation'
import { inferNonFunctionalDetail } from '../utils/nonFunctionalInference'

function normalizeNonFunctionalCategory(value: string): string {
  if (!value) return ''
  const upper = value.toUpperCase().trim()
  if (upper.includes('SEGURIDAD') || upper.includes('SECURITY')) return 'SECURITY'
  if (upper.includes('RENDIMIENTO') || upper.includes('PERFORMANCE')) return 'PERFORMANCE'
  if (upper.includes('USABILIDAD') || upper.includes('USABILITY')) return 'USABILITY'
  if (upper.includes('CONFIABILIDAD') || upper.includes('RELIABILITY')) return 'RELIABILITY'
  if (upper.includes('MANTENIBILIDAD') || upper.includes('MAINTAINABILITY')) return 'MAINTAINABILITY'
  if (upper.includes('PORTABILIDAD') || upper.includes('PORTABILITY')) return 'PORTABILITY'
  if (upper.includes('COMPATIBILIDAD') || upper.includes('COMPATIBILITY')) return 'COMPATIBILITY'
  return upper
}

// ── Input style ────────────────────────────────────────────────────────────

const textareaCls = [
  'w-full px-3 py-2 text-[13px] rounded-lg',
  'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
  'transition-all duration-150 resize-y min-h-[180px]',
].join(' ')

// ── Page ─────────────────────────────────────────────────────────────────

export function RequirementAIPage({ requirementType }: RequirementAIPageProps) {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const navigate = useNavigate()

  // Always prefer URL param; context as fallback
  const projectId = routeProjectId ?? contextProjectId ?? ''

  // ── State ──
  const [inputText, setInputText] = useState('')
  const [drafts, setDrafts] = useState<RequirementDraft[]>([])
  const [sourceSummary, setSourceSummary] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [isSavingBatch, setIsSavingBatch] = useState(false)
  const [saveProgress, setSaveProgress] = useState('')
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null)

  const [quotaCountdown, setQuotaCountdown] = useState(0)
  const [quotaErrorMessage, setQuotaErrorMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const { addError } = useLoadingError()

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (quotaCountdown > 0) {
      const timer = setTimeout(() => setQuotaCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [quotaCountdown])

  // ── Guard ─────────────────────────────────────────────────────────────

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para usar la generación con IA." />
  }

  if (projectId.startsWith('USR-')) {
    return <NoProjectSelected message="El ID detectado corresponde a un usuario, no a un proyecto. Por favor selecciona un proyecto válido." />
  }

  // ── Handlers ──────────────────────────────────────────────────────────

  const MIN_TEXT_LENGTH = 20

  async function handleGenerate() {
    const text = inputText.trim()
    if (!text || text.length < MIN_TEXT_LENGTH) return

    // Do not clear drafts upfront so we don't lose them on error
    setSourceSummary('')
    setWarnings([])
    setBatchSuccessMessage(null)
    setQuotaErrorMessage(null)
    setIsGenerating(true)

    try {
      const data = await requirementFacade.generateRequirementDraftsFromText(projectId, text, requirementType)

      if (!data || !data.requirements || data.requirements.length === 0) {
        setIsGenerating(false)
        return
      }

      setSourceSummary(data.sourceSummary || '')
      setWarnings(data.warnings || [])

      // Prepare draft state items
      const newDrafts: RequirementDraft[] = data.requirements.map(req => {
        // Force correct project context and type
        const requirement: RequirementDTO = {
          ...req,
          id: '', // Empty string instead of null to satisfy TS string type
          projectId,
        }
        ;(requirement as any).requirementType = requirementType

        if (requirementType === 'NON_FUNCTIONAL') {
          requirement.nonFunctionalDetail = inferNonFunctionalDetail(requirement)
          if (requirement.nonFunctionalDetail) {
            requirement.nonFunctionalDetail.category = normalizeNonFunctionalCategory(requirement.nonFunctionalDetail.category)
          }
        }

        const validation = validateRequirementBeforeSave(requirement, requirementType)

        return {
          draftId: crypto.randomUUID(),
          requirement,
          duplicateState: { status: 'idle' },
          isEditing: false,
          selected: true,
          discarded: false,
          duplicateConfirmed: false,
          validationErrors: validation.errors,
          validationWarnings: validation.warnings,
          classificationWarningConfirmed: false
        }
      })

      setDrafts(newDrafts)

      // Fire duplicate checks in parallel
      newDrafts.forEach(draft => {
        void checkDuplicatesForDraft(draft.draftId, draft.requirement)
      })
    } catch (error: any) {
      const status = error?.response?.status
      const errorCode = error?.response?.data?.error?.code
      if (status === 429 || errorCode === 'error.ia.quota_exceeded') {
        const retryHeader = error?.response?.headers?.['retry-after']
        let retryAfter = retryHeader ? parseInt(retryHeader, 10) : undefined
        if (retryAfter === undefined || isNaN(retryAfter)) {
          retryAfter = error?.response?.data?.error?.details?.retryAfter
        }

        setQuotaErrorMessage('Se alcanzó el límite gratuito de Gemini. Espera unos segundos e intenta nuevamente, o activa la facturación de la API para continuar.')
        if (retryAfter && !isNaN(retryAfter) && retryAfter > 0) {
          setQuotaCountdown(retryAfter)
        }
      } else {
        addError('Error al generar propuestas con IA. Intenta de nuevo.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  async function checkDuplicatesForDraft(draftId: string, req: RequirementDTO) {
    updateDraft(draftId, { duplicateState: { status: 'checking' }, duplicateConfirmed: false })
    try {
      const duplicates = await requirementFacade.checkDuplicates({
        projectId,
        title: req.title,
        description: req.description,
      })
      if (duplicates && duplicates.length > 0) {
        updateDraft(draftId, { duplicateState: { status: 'found', duplicates } })
      } else {
        updateDraft(draftId, { duplicateState: { status: 'none' } })
      }
    } catch {
      updateDraft(draftId, { duplicateState: { status: 'error' } })
    }
  }

  function updateDraft(draftId: string, updates: Partial<RequirementDraft>) {
    setDrafts(prev => prev.map(d => (d.draftId === draftId ? { ...d, ...updates } : d)))
  }

  function handleRequirementChange(draftId: string, updatedRequirement: RequirementDTO) {
    const validation = validateRequirementBeforeSave(updatedRequirement, requirementType)
    updateDraft(draftId, { 
      requirement: updatedRequirement, 
      duplicateState: { status: 'idle' }, 
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      backendError: null
    })
  }

  function handleRecheckDuplicates(draftId: string, req: RequirementDTO) {
    void checkDuplicatesForDraft(draftId, req)
  }

  async function handleSaveSelected() {
    const selectedDrafts = drafts.filter(d => d.selected && !d.discarded)
    if (selectedDrafts.length === 0) return

    // Pre-flight: validate fields and check duplicate confirmations
    let canProceed = true
    const newDrafts = drafts.map(d => {
      if (!d.selected || d.discarded) return d
      const validation = validateRequirementBeforeSave(d.requirement, requirementType)
      const errors = validation.errors
      const warnings = validation.warnings
      const isCrossMatchOnly = d.duplicateState.status === 'found' && d.duplicateState.duplicates.every(dup => requirementType === 'NON_FUNCTIONAL' && dup.requirementType === 'FUNCTIONAL')
      const unconfirmedDup = !d.duplicateConfirmed && !isCrossMatchOnly && (d.duplicateState.status === 'found' || d.duplicateState.status === 'error')
      const unconfirmedWarn = !d.classificationWarningConfirmed && warnings.length > 0
      
      if (errors.length > 0 || unconfirmedDup || unconfirmedWarn) {
        canProceed = false
      }
      
      return { 
        ...d, 
        validationErrors: errors,
        validationWarnings: warnings
      }
    })

    if (!canProceed) {
      setDrafts(newDrafts)
      return
    }

    // Proceed to save sequentially
    setIsSavingBatch(true)
    let savedCount = 0
    let errorCount = 0

    for (let i = 0; i < selectedDrafts.length; i++) {
      const draft = selectedDrafts[i]
      setSaveProgress(`Guardando ${i + 1} de ${selectedDrafts.length}...`)
      
      // Build clean payload
      const toSave: RequirementDTO = {
        ...draft.requirement,
        id: '', // Empty string for creation
        projectId,
        title: draft.requirement.title.trim(),
        description: draft.requirement.description.trim(),
        requirementType: requirementType,
        nonFunctionalDetail: requirementType === 'FUNCTIONAL' ? null : {
          ...draft.requirement.nonFunctionalDetail!,
          category: normalizeNonFunctionalCategory(draft.requirement.nonFunctionalDetail?.category || '')
        }
      } as RequirementDTO

      try {
        const saved = await requirementFacade.saveRequirement(toSave)
        if (saved) {
          savedCount++
          // mark as successfully saved (remove from selection and hide)
          updateDraft(draft.draftId, { selected: false, discarded: true, backendError: null })
        } else {
          errorCount++
          updateDraft(draft.draftId, { backendError: 'Error desconocido al guardar.' })
        }
      } catch (err: any) {
        errorCount++
        const msg = err?.response?.data?.message || err?.message || 'Error de red al guardar.'
        updateDraft(draft.draftId, { backendError: msg })
      }
    }

    setIsSavingBatch(false)
    setSaveProgress('')
    
    if (errorCount === 0 && savedCount > 0) {
      setBatchSuccessMessage(`${savedCount} requisitos guardados correctamente.`)
      setTimeout(() => {
        navigate(manualPath(projectId, requirementType))
      }, 2000)
    } else if (errorCount > 0) {
      setBatchSuccessMessage(`Se guardaron ${savedCount} requisitos, pero ${errorCount} fallaron. Revisa los errores en las tarjetas.`)
    }
  }

  const selectedCount = drafts.filter(d => d.selected && !d.discarded).length
  const canGenerate = inputText.trim().length >= MIN_TEXT_LENGTH && !isGenerating && !isSavingBatch && quotaCountdown === 0

  // ── Render ────────────────────────────────────────────────────────────

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

            {drafts.filter(d => !d.discarded).map((item) => {
              const isCrossMatchOnly = item.duplicateState.status === 'found' && item.duplicateState.duplicates.every(dup => requirementType === 'NON_FUNCTIONAL' && dup.requirementType === 'FUNCTIONAL')
              const unconfirmedDup = !item.duplicateConfirmed && !isCrossMatchOnly && (item.duplicateState.status === 'found' || item.duplicateState.status === 'error')
              const hasErrors = item.validationErrors.length > 0
              const hasWarnings = item.validationWarnings.length > 0
              const unconfirmedWarn = hasWarnings && !item.classificationWarningConfirmed

              let status: 'Completo' | 'Incompleto' | 'Posible RF mal clasificado' = 'Completo'
              if (hasErrors) status = 'Incompleto'
              else if (hasWarnings) status = 'Posible RF mal clasificado'

              return (
                <div 
                  key={item.draftId} 
                  className={`flex gap-3 transition-opacity ${!item.selected ? 'opacity-50' : ''}`}
                >
                  {/* Selection Checkbox Container */}
                  <div className="pt-4 flex-shrink-0 flex flex-col gap-3 items-center">
                    <label className="flex items-center justify-center w-6 h-6 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={item.selected}
                        onChange={(e) => updateDraft(item.draftId, { selected: e.target.checked })}
                        className="w-4 h-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-bg)] cursor-pointer"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => updateDraft(item.draftId, { discarded: true })}
                      title="Descartar propuesta"
                      className="text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Draft Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <RequirementDraftEditor
                      draft={item.requirement}
                      isEditing={item.isEditing}
                      onToggleEdit={() => updateDraft(item.draftId, { isEditing: !item.isEditing })}
                      onChange={(req) => handleRequirementChange(item.draftId, req)}
                      draftStatus={status}
                    />

                    {/* Backend Error */}
                    {item.backendError && (
                      <div className="px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-[12.5px] text-rose-600 dark:text-rose-400 font-medium">
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Error al guardar: {item.backendError}
                        </p>
                      </div>
                    )}

                    {/* Validation Errors for this draft */}
                    {item.selected && hasErrors && (
                      <div className="px-4 py-2.5 rounded-xl border border-rose-400/30 bg-rose-50/10 dark:bg-rose-900/10 space-y-1">
                        <p className="text-[12px] font-semibold text-rose-600 dark:text-rose-400 mb-1">Requiere corrección:</p>
                        {item.validationErrors.map((err, i) => (
                          <p key={i} className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                            {err}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Validation Warnings for this draft */}
                    {item.selected && unconfirmedWarn && !hasErrors && (
                      <div className="px-4 py-3 rounded-xl border border-amber-400/30 bg-amber-50/10 dark:bg-amber-900/10 space-y-3">
                        <div>
                          <p className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 mb-1">Advertencia de clasificación:</p>
                          {item.validationWarnings.map((warn, i) => (
                            <p key={i} className="text-[12px] text-[var(--color-text-muted)] flex items-start gap-1.5 leading-relaxed">
                              <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                              {warn}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-amber-400/20">
                          <button
                            type="button"
                            onClick={() => updateDraft(item.draftId, { classificationWarningConfirmed: true })}
                            className="h-7 px-3 rounded-md text-[11px] font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                          >
                            Confirmar de todas formas
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Unconfirmed duplicate blocker warning */}
                    {item.selected && unconfirmedDup && !hasErrors && (
                      <div className="px-4 py-2.5 rounded-xl border border-amber-400/30 bg-amber-50/10 dark:bg-amber-900/10">
                        <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
                          Revisa la advertencia de duplicados abajo y confirma antes de guardar.
                        </p>
                      </div>
                    )}

                    {/* Duplicate Check Panel */}
                    {item.selected && (
                      item.duplicateState.status === 'idle' ? (
                        <button
                          type="button"
                          onClick={() => handleRecheckDuplicates(item.draftId, item.requirement)}
                          className="w-full h-8 rounded-lg text-[12px] font-medium border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all"
                        >
                          Verificar duplicados
                        </button>
                      ) : (
                        <DuplicateWarningPanel
                          state={item.duplicateState}
                          isConfirmed={item.duplicateConfirmed}
                          onConfirm={() => updateDraft(item.draftId, { duplicateConfirmed: true })}
                          onEdit={() => updateDraft(item.draftId, { isEditing: true })}
                          onDiscard={() => updateDraft(item.draftId, { discarded: true })}
                          currentDraftType={requirementType}
                        />
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default RequirementAIPage
