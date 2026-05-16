import { useState, useEffect } from 'react'
import { requirementFacade } from '../facades/requirement.facade'
import { useApiOperation } from './useLoadingError'
import { isValidProjectId } from '../context/ProjectContext'
import type { ValidationRule } from '../types/requirements'

export function useValidationRules(projectId: string) {
  const EMPTY_RULE: ValidationRule = {
    projectId,
    name: '',
    description: '',
    type: 'AMBIGUOUS_TERMS',
    target: 'BOTH',
    severity: 'WARNING',
    active: true,
  }

  const [form, setForm] = useState<ValidationRule>(EMPTY_RULE)
  const [rules, setRules] = useState<ValidationRule[]>([])
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const { run, isLoading } = useApiOperation()

  useEffect(() => {
    if (isValidProjectId(projectId)) {
      void handleList()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleList() {
    await run(async () => {
      const data = await requirementFacade.listValidationRules(projectId)
      setRules(data)
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.name.trim() || !form.description.trim()) {
      alert('Nombre y descripción son obligatorios.')
      return
    }

    await run(async () => {
      if (selectedRuleId) {
        await requirementFacade.updateValidationRule(selectedRuleId, form)
      } else {
        await requirementFacade.createValidationRule(form)
      }
      await handleList()
      handleReset()
    }, { errorMessage: 'Error al guardar la regla.' })
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta regla?')) return
    await run(async () => {
      await requirementFacade.deleteValidationRule(id)
      await handleList()
      if (selectedRuleId === id) handleReset()
    })
  }

  async function handleToggle(id: string) {
    await run(async () => {
      await requirementFacade.toggleValidationRule(id)
      await handleList()
    })
  }

  function handleSelect(rule: ValidationRule) {
    setSelectedRuleId(rule.id || null)
    setForm({
      projectId: rule.projectId,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      target: rule.target,
      severity: rule.severity,
      active: rule.active,
      config: rule.config,
    })
  }

  function handleReset() {
    setSelectedRuleId(null)
    setForm(EMPTY_RULE)
  }

  function setFormValue<K extends keyof ValidationRule>(key: K, value: ValidationRule[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return {
    form,
    setFormValue,
    rules,
    selectedRuleId,
    isLoading,
    handleSave,
    handleDelete,
    handleToggle,
    handleSelect,
    handleReset,
  }
}
