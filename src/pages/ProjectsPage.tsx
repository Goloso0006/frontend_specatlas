import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import ProjectForm from '../components/projects/ProjectForm'
import EmptyProjectsState from '../components/projects/EmptyProjectsState'
import ManageProjectCard from '../components/projects/ManageProjectCard'
import { useProjects } from '../hooks/useProjects'

export function ProjectsPage() {
  const {
    form,
    projects,
    selectedProject,
    isFormOpen,
    setIsFormOpen,
    handleSave,
    handleDelete,
    updateField,
    handleNewProject,
    handleEditProject,
  } = useProjects()

  return (
    <PageShell>
      <PageHeader 
        title="Proyectos" 
        description="Gestiona tus espacios de análisis, requisitos y diagramas."
        action={
          !isFormOpen && (
            <Button onClick={handleNewProject}>
              Nuevo proyecto
            </Button>
          )
        }
      />

      {isFormOpen ? (
        <ProjectForm
          form={form}
          selectedProject={selectedProject}
          onUpdateField={updateField}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      ) : projects.length === 0 ? (
        <EmptyProjectsState onNewProject={handleNewProject} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ManageProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}
