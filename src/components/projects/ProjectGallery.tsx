import React from 'react'
import type { ProjectResponse } from '../../types/projects'
import ProjectCard from './ProjectCard'

export const ProjectGallery: React.FC<{
  projects: ProjectResponse[]
  onCardClick?: (id: string) => void
}> = ({ projects, onCardClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} onClick={onCardClick} />
      ))}
    </div>
  )
}

export default ProjectGallery
