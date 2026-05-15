import { useState, useEffect } from 'react'
import { validationRuleFacade } from '../facades/validationRule.facade'
import { useApiOperation } from './useLoadingError'
import { isValidProjectId } from '../context/ProjectContext'
import type { ValidationRuleRequest, ValidationRuleResponse } from '../types/validationRules'

export function useValidationRules(projectId: string) {
  const EMPTY_RULE: ValidationRuleRequest = {
    projectId,
    name: '',
    description: '',
    ruleType: '',
    condition: '',
    severity: 'WARN',
    enabled: true,
  }

  const [form, setForm] = useState<ValidationRuleRequest>(EMPTY_RULE)
  const [rules, setRules] = useState<ValidationRuleResponse[]>([])
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
      const data = await validationRuleFacade.getRulesByProject(projectId)
      setRules(data)
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.name.trim() || !form.ruleType.trim() || !form.condition.trim() || !form.description.trim()) {
      alert('Todos los campos son obligatorios.')
      return
    }

    await run(async () => {
      if (selectedRuleId) {
        await validationRuleFacade.updateRule(selectedRuleId, form)
      } else {
        await validationRuleFacade.createRule(form)
      }
      await handleList()
      handleReset()
    }, { errorMessage: 'Error al guardar la regla.' })
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta regla?')) return
    await run(async () => {
      await validationRuleFacade.deleteRule(id)
      await handleList()
      if (selectedRuleId === id) handleReset()
    })
  }

  function handleSelect(rule: ValidationRuleResponse) {
    setSelectedRuleId(rule.id)
    setForm({
      projectId: rule.projectId,
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      condition: rule.condition,
      severity: rule.severity,
      enabled: rule.enabled,
    })
  }

  function handleReset() {
    setSelectedRuleId(null)
    setForm(EMPTY_RULE)
  }

  function setFormValue<K extends keyof ValidationRuleRequest>(key: K, value: ValidationRuleRequest[K]) {
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
    handleSelect,
    handleReset,
  }
}
