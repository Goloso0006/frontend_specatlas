import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { ProjectResponse } from '../../types/projects'

export const ProjectCard: React.FC<{
  project: ProjectResponse
  onClick?: (id: string) => void
}> = ({ project, onClick }) => {
  return (
    <Card clickable className="overflow-hidden p-0" onClick={() => onClick?.(project.id)}>
      <div className="h-28 w-full bg-gradient-to-r from-[#f5f5f7] via-[#efefef] to-[#f9f9fb] flex items-end p-4">
        <div className="text-xs text-app-text-muted">&nbsp;</div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[16px] font-semibold app-text-primary truncate">{project.name}</h3>
          <span className="text-[11px] app-text-muted uppercase tracking-wider">{project.id.slice(0,8)}</span>
        </div>

        <p className="text-[13px] app-text-secondary line-clamp-2 mb-4">{project.description || 'Sin descripción'}</p>

        <div className="flex items-center justify-between">
          <Badge variant={project.status === 'ACTIVE' ? 'success' : project.status === 'DRAFT' ? 'warning' : 'neutral'}>
            {project.status}
          </Badge>
          <div className="text-[12px] text-app-text-muted">{new Date(project.createdAt || Date.now()).toLocaleDateString()}</div>
        </div>
      </div>
    </Card>
  )
}

export default ProjectCard
