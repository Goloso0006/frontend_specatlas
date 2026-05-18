import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { requirementFacade } from '../facades/requirement.facade'
import { useLoadingError } from './useLoadingError'
import type { RequirementDTO } from '../types/requirements'
import { validateRequirementBeforeSave } from '../utils/requirementValidation'
import type { DuplicateCheckState } from '../components/requirements/DuplicateWarningPanel'

export type RequirementType = 'FUNCTIONAL' | 'NON_FUNCTIONAL'

export interface RequirementDraft {
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

export const MIN_TEXT_LENGTH = 20

function manualPath(projectId: string, type: RequirementType): string {
  return type === 'FUNCTIONAL'
    ? `/app/projects/${projectId}/requirements/functional/manual`
    : `/app/projects/${projectId}/requirements/non-functional/manual`
}

export function normalizeNonFunctionalCategory(value: string): string {
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

export function useRequirementAI(projectId: string, requirementType: RequirementType) {
  const navigate = useNavigate()
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

  useEffect(() => {
    if (quotaCountdown > 0) {
      const timer = setTimeout(() => setQuotaCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [quotaCountdown])

  function updateDraft(draftId: string, updates: Partial<RequirementDraft>) {
    setDrafts(prev => prev.map(d => (d.draftId === draftId ? { ...d, ...updates } : d)))
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

  function handleRequirementChange(draftId: string, updatedRequirement: RequirementDTO) {
    const requirement = {
      ...updatedRequirement,
      nonFunctionalDetail:
        (updatedRequirement.requirementType === 'NON_FUNCTIONAL' || requirementType === 'NON_FUNCTIONAL')
          ? {
              category: updatedRequirement.nonFunctionalDetail?.category ?? "",
              metricName: updatedRequirement.nonFunctionalDetail?.metricName ?? "",
              operator: updatedRequirement.nonFunctionalDetail?.operator ?? "",
              targetValue: updatedRequirement.nonFunctionalDetail?.targetValue ?? "",
              unit: updatedRequirement.nonFunctionalDetail?.unit ?? "",
              context: updatedRequirement.nonFunctionalDetail?.context ?? "",
              verificationMethod: updatedRequirement.nonFunctionalDetail?.verificationMethod ?? "",
              rationale: updatedRequirement.nonFunctionalDetail?.rationale ?? "",
            }
          : null
    }

    const validation = validateRequirementBeforeSave(requirement, requirementType)
    updateDraft(draftId, { 
      requirement, 
      duplicateState: { status: 'idle' }, 
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      backendError: null
    })
  }

  function handleRecheckDuplicates(draftId: string, req: RequirementDTO) {
    void checkDuplicatesForDraft(draftId, req)
  }

  async function handleGenerate() {
    const text = inputText.trim()
    if (!text || text.length < MIN_TEXT_LENGTH) return

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

      if (data?.requirements) {
        console.table(data.requirements.map((r: any) => ({ rawCode: r.code, title: r.title })));
      }

      const normalizedRequirements = data.requirements.map(req => {
        const requirement: RequirementDTO = {
          id: req.id || crypto.randomUUID(),
          code: req.code ?? "",
          title: req.title ?? "",
          description: req.description ?? "",
          actors: req.actors ?? [],
          acceptanceCriteria: req.acceptanceCriteria ?? [],
          isoClassification: req.isoClassification ?? "",
          requirementType: req.requirementType ?? requirementType,
          projectId: req.projectId ?? projectId,
          relatedCodes: req.relatedCodes ?? [],
          nonFunctionalDetail:
            (req.requirementType === 'NON_FUNCTIONAL' || requirementType === 'NON_FUNCTIONAL')
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
        }

        if (requirement.requirementType === 'NON_FUNCTIONAL' && requirement.nonFunctionalDetail) {
          requirement.nonFunctionalDetail.category = normalizeNonFunctionalCategory(requirement.nonFunctionalDetail.category)
        }

        return requirement
      })

      console.table(normalizedRequirements.map((r: any) => ({ normalizedCode: r.code, title: r.title })));

      console.log("[AI_GENERATED_REQUIREMENTS] total:", normalizedRequirements.length);
      console.table(
        normalizedRequirements.map((r) => ({
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

      const newDrafts: RequirementDraft[] = normalizedRequirements.map(requirement => {
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

      newDrafts.forEach(draft => {
        void checkDuplicatesForDraft(draft.draftId, draft.requirement)
      })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const detail = error?.message || 'Error desconocido'
        addError(`Error al generar propuestas con IA: ${detail}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSaveSelected() {
    const selectedDrafts = drafts.filter(d => d.selected && !d.discarded)
    if (selectedDrafts.length === 0) return

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

    setIsSavingBatch(true)
    let savedCount = 0
    let errorCount = 0

    for (let i = 0; i < selectedDrafts.length; i++) {
      const draft = selectedDrafts[i]
      setSaveProgress(`Guardando ${i + 1} de ${selectedDrafts.length}...`)
      
      const payload = {
        projectId,
        code: draft.requirement.code ?? "",
        title: draft.requirement.title.trim(),
        description: draft.requirement.description.trim(),
        actors: draft.requirement.actors ?? [],
        acceptanceCriteria: draft.requirement.acceptanceCriteria ?? [],
        isoClassification: draft.requirement.isoClassification,
        requirementType: draft.requirement.requirementType ?? requirementType,
        relatedCodes: draft.requirement.relatedCodes ?? [],
        nonFunctionalDetail:
          (draft.requirement.requirementType === 'NON_FUNCTIONAL' || requirementType === 'NON_FUNCTIONAL')
            ? {
                category: normalizeNonFunctionalCategory(draft.requirement.nonFunctionalDetail?.category ?? ""),
                metricName: draft.requirement.nonFunctionalDetail?.metricName ?? "",
                operator: draft.requirement.nonFunctionalDetail?.operator ?? "",
                targetValue: draft.requirement.nonFunctionalDetail?.targetValue ?? "",
                unit: draft.requirement.nonFunctionalDetail?.unit ?? "",
                context: draft.requirement.nonFunctionalDetail?.context ?? "",
                verificationMethod: draft.requirement.nonFunctionalDetail?.verificationMethod ?? "",
                rationale: draft.requirement.nonFunctionalDetail?.rationale ?? "",
              }
            : null,
      }

      console.log("[REQUIREMENT_SAVE_PAYLOAD]", payload);

      try {
        const saved = await requirementFacade.saveRequirement(payload as any)
        if (saved) {
          savedCount++
          updateDraft(draft.draftId, { selected: false, discarded: true, backendError: null })
        } else {
          errorCount++
          updateDraft(draft.draftId, { backendError: 'Error desconocido al guardar.' })
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return {
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
  }
}
