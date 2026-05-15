import { useParams } from 'react-router-dom'
import { isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { ValidationRuleList } from '../components/validationRules/ValidationRuleList'
import { ValidationRuleForm } from '../components/validationRules/ValidationRuleForm'
import { useValidationRules } from '../hooks/useValidationRules'

export function ValidationRulesPage() {
  const { projectId: routeProjectId } = useParams()
  const projectId = routeProjectId ?? ''

  const {
    form,
    setFormValue,
    rules,
    selectedRuleId,
    isLoading,
    handleSave,
    handleDelete,
    handleSelect,
    handleReset,
  } = useValidationRules(projectId)

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para gestionar sus reglas." />
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <main className="max-w-6xl mx-auto w-full py-12 px-8 grid gap-12 lg:grid-cols-[1fr_400px]">
        <ValidationRuleList
          rules={rules}
          selectedRuleId={selectedRuleId}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
        
        <ValidationRuleForm
          form={form}
          selectedRuleId={selectedRuleId}
          isLoading={isLoading}
          onFormValueChange={setFormValue}
          onSave={handleSave}
          onReset={handleReset}
        />
      </main>
    </div>
  )
}

export default ValidationRulesPage
