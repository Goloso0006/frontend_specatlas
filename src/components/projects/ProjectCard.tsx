import type { ProjectResponse } from '../../types/projects'

export const ProjectCard = ({ project, onClick }: {
  project: ProjectResponse
  onClick?: (id: string) => void
}) => {
  return (
    <div 
      onClick={() => onClick?.(project.id)}
      className="group relative flex flex-col bg-white dark:bg-[#1e1e1e] border border-app-border rounded-xl overflow-hidden cursor-pointer interactive hover:shadow-xl hover:border-app-border-strong card-hover h-full"
    >
      {/* Cover Placeholder (slightly smaller) */}
      <div className="h-24 w-full bg-[#f8f8f8] dark:bg-[#252525] border-b border-app-border flex items-center justify-center overflow-hidden">
        <div className="text-3xl opacity-20 group-hover:scale-110 transition-transform duration-500">📁</div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[17px] font-semibold app-text-primary tracking-tight group-hover:text-app-accent transition-colors">
            {project.name}
          </h3>
        </div>

        <p className="text-[13px] app-text-secondary mb-4 flex-1 whitespace-pre-wrap break-words leading-relaxed line-clamp-4">
          {project.description || 'Sin descripción'}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-app-border/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${project.status === 'ACTIVE' ? 'bg-green-500' : project.status === 'DRAFT' ? 'bg-amber-500' : 'bg-gray-400'}`} />
            <span className="text-[11px] font-medium uppercase tracking-wider text-app-text-muted">
              {project.status}
            </span>
          </div>
          <span className="text-[11px] text-app-text-muted font-mono">
            {project.id.slice(0, 8)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
