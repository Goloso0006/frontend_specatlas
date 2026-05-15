import type { ProjectResponse } from '../../types/projects'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface ManageProjectCardProps {
  project: ProjectResponse
  onEdit: (project: ProjectResponse) => void
  onDelete: (id: string) => void
}

export default function ManageProjectCard({ project, onEdit, onDelete }: ManageProjectCardProps) {
  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'ARCHIVED': return 'neutral'
      case 'DRAFT': return 'warning'
      default: return 'neutral'
    }
  }

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between mb-3">
        <Badge variant={getStatusBadgeVariant(project.status)}>
          {project.status}
        </Badge>
        <span className="text-[11px] app-text-muted uppercase tracking-wider" title="ID del Proyecto">
          {project.id}
        </span>
      </div>
      
      <h3 className="text-[17px] font-semibold app-text-primary mb-1">
        {project.name}
      </h3>
      
      <p className="text-[13px] app-text-secondary mb-6 flex-1 whitespace-pre-wrap break-words leading-relaxed line-clamp-4">
        {project.description || 'Sin descripción'}
      </p>
      
      <div className="flex items-center gap-2 pt-4 border-t border-app-border mt-auto">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1"
          onClick={() => onEdit(project)}
        >
          Editar
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onDelete(project.id)}
        >
          Eliminar
        </Button>
      </div>
    </Card>
  )
}
