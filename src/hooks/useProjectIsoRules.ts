import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiOperation } from './useLoadingError'
import { validationRuleFacade } from '../facades/validationRule.facade'
import { isValidProjectId } from '../context/ProjectContext'
import {
  ISO_PRESETS,
  ISO_RULE_CATALOG,
  getPresetWithRules,
  searchIsoRules,
} from '../constants/validationRuleTemplates'
import type { ValidationRuleRequest } from '../types/validationRules'

type IsoRulesDraft = {
  manualSelectedRuleIds: string[]
  activePresetIds: string[]
  excludedRuleIds: string[]
}

function toSet(values: string[] | undefined): Set<string> {
  return new Set(values || [])
}

function inferActivePresetIds(selectedRuleIds: Set<string>): Set<string> {
  const active = ISO_PRESETS.filter((preset) => {
    const presetRules = getPresetWithRules(preset.id)?.rules || []
    return presetRules.length > 0 && presetRules.every((rule) => selectedRuleIds.has(rule.id))
  }).map((preset) => preset.id)

  return new Set(active)
}

export function useProjectIsoRules(projectId: string | undefined) {
  const navigate = useNavigate()
  const { run, isLoading } = useApiOperation()

  const [searchQuery, setSearchQuery] = useState('')
  const [manualSelectedRuleIds, setManualSelectedRuleIds] = useState<Set<string>>(new Set())
  const [activePresetIds, setActivePresetIds] = useState<Set<string>>(new Set())
  const [excludedRuleIds, setExcludedRuleIds] = useState<Set<string>>(new Set())
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const selectedRuleIds = useMemo(() => {
    const ids = new Set(manualSelectedRuleIds)

    activePresetIds.forEach((presetId) => {
      const preset = getPresetWithRules(presetId)
      preset?.rules.forEach((rule) => ids.add(rule.id))
    })

    excludedRuleIds.forEach((ruleId) => ids.delete(ruleId))

    return ids
  }, [manualSelectedRuleIds, activePresetIds, excludedRuleIds])

  const filteredRules =
    filterCategory === null
      ? searchIsoRules(searchQuery)
      : searchIsoRules(searchQuery).filter((rule) => rule.category === filterCategory)

  const selectedRules = ISO_RULE_CATALOG.filter((rule) => selectedRuleIds.has(rule.id))
  const categories = Array.from(new Set(ISO_RULE_CATALOG.map((rule) => rule.category)))

  function toggleRule(ruleId: string) {
    if (selectedRuleIds.has(ruleId)) {
      setManualSelectedRuleIds((current) => {
        const next = new Set(current)
        next.delete(ruleId)
        return next
      })

      setExcludedRuleIds((current) => {
        const next = new Set(current)
        next.add(ruleId)
        return next
      })
      return
    }

    setManualSelectedRuleIds((current) => {
      const next = new Set(current)
      next.add(ruleId)
      return next
    })

    setExcludedRuleIds((current) => {
      const next = new Set(current)
      next.delete(ruleId)
      return next
    })
  }

  function toggleExpandRule(ruleId: string) {
    setExpandedRules((current) => {
      const next = new Set(current)
      if (next.has(ruleId)) {
        next.delete(ruleId)
      } else {
        next.add(ruleId)
      }
      return next
    })
  }

  function applyPreset(presetId: string) {
    const preset = getPresetWithRules(presetId)
    if (!preset) return

    setActivePresetIds((current) => {
      const next = new Set(current)
      if (next.has(presetId)) {
        next.delete(presetId)
      } else {
        next.add(presetId)
      }
      return next
    })

    setExcludedRuleIds((current) => {
      const next = new Set(current)
      if (!activePresetIds.has(presetId)) {
        preset.rules.forEach((rule) => next.delete(rule.id))
      }
      return next
    })
  }

  function removeRule(ruleId: string) {
    toggleRule(ruleId)
  }

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      quality: 'Calidad',
      security: 'Seguridad',
      governance: 'Gestión y control',
      agile: 'Ágil',
      architecture: 'Arquitectura',
    }

    return labels[category] || category
  }

  useEffect(() => {
    if (!projectId || !isHydrated) return

    const draftKey = `iso_rules_draft_${projectId}`
    const payload: IsoRulesDraft = {
      manualSelectedRuleIds: Array.from(manualSelectedRuleIds),
      activePresetIds: Array.from(activePresetIds),
      excludedRuleIds: Array.from(excludedRuleIds),
    }

    try {
      localStorage.setItem(draftKey, JSON.stringify(payload))
    } catch {
      // ignore storage errors
    }
  }, [projectId, isHydrated, manualSelectedRuleIds, activePresetIds, excludedRuleIds])

  useEffect(() => {
    if (!projectId) return

    const init = async () => {
      const skipKey = `iso_rules_skipped_${projectId}`
      const skipped = localStorage.getItem(skipKey)
      if (skipped === '1') {
        navigate(`/app/projects/${projectId}`)
        return
      }

      try {
        const existing = await validationRuleFacade.getRulesByProject(projectId)
        if (existing.length > 0) {
          const ids = existing
            .map((rule) => ISO_RULE_CATALOG.find((candidate) => candidate.code === rule.name)?.id)
            .filter((id): id is string => Boolean(id))

          const idsSet = new Set(ids)
          setManualSelectedRuleIds(idsSet)
          setActivePresetIds(inferActivePresetIds(idsSet))
          setExcludedRuleIds(new Set())
          setIsHydrated(true)
          return
        }
      } catch {
        // ignore and try draft
      }

      try {
        const draftKey = `iso_rules_draft_${projectId}`
        const raw = localStorage.getItem(draftKey)
        if (raw) {
          const parsed = JSON.parse(raw) as IsoRulesDraft | string[]

          if (Array.isArray(parsed)) {
            setManualSelectedRuleIds(toSet(parsed))
            setActivePresetIds(new Set())
            setExcludedRuleIds(new Set())
          } else {
            setManualSelectedRuleIds(toSet(parsed.manualSelectedRuleIds))
            setActivePresetIds(toSet(parsed.activePresetIds))
            setExcludedRuleIds(toSet(parsed.excludedRuleIds))
          }

          setIsHydrated(true)
          return
        }
      } catch {
        // ignore draft errors
      }

      setIsHydrated(true)
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleNext() {
    if (selectedRules.length === 0) {
      alert('Por favor, selecciona al menos una regla.')
      return
    }

    if (!projectId || !isValidProjectId(projectId)) {
      alert('Error: Project ID inválido.')
      return
    }

    await run(
      async () => {
        const rulesToCreate: ValidationRuleRequest[] = selectedRules.map((rule) => ({
          projectId,
          name: rule.code,
          description: rule.description,
          ruleType: rule.ruleType,
          condition: rule.condition,
          severity: rule.level === 'essential' ? 'ERROR' : 'WARN',
          enabled: true,
        }))

        await Promise.all(rulesToCreate.map((rule) => validationRuleFacade.createRule(rule)))

        try {
          localStorage.removeItem(`iso_rules_draft_${projectId}`)
          localStorage.removeItem(`iso_rules_skipped_${projectId}`)
        } catch {
          // ignore storage cleanup errors
        }

        navigate(`/app/projects/${projectId}`)
      },
      { errorMessage: 'No fue posible guardar las reglas del proyecto.' }
    )
  }

  function handleSkip() {
    if (!projectId) return
    localStorage.setItem(`iso_rules_skipped_${projectId}`, '1')
    navigate(`/app/projects/${projectId}`)
  }

  return {
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    selectedRuleIds,
    expandedRules,
    filteredRules,
    selectedRules,
    categories,
    isLoading,
    toggleRule,
    toggleExpandRule,
    applyPreset,
    removeRule,
    getCategoryLabel,
    handleNext,
    handleSkip,
  }
}
