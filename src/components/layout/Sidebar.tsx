import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { AnimatedThemeToggler } from '../ui/AnimatedThemeToggler';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  // Extract projectId from route if we're inside a project context
  // Matches routes like /app/projects/:projectId, /app/projects/:projectId/requirements, etc.
  const projectIdMatch = location.pathname.match(/\/app\/projects\/([^/]+)/);
  const currentProjectId = projectIdMatch?.[1] ?? null;

  // Base navigation items (always visible)
  const baseNavItems = [
    { name: 'Dashboard', path: '/app' },
    { name: 'Proyectos', path: '/app/projects' },
  ];

  // Project-scoped navigation (only visible when inside a project)
  const projectNavItems = currentProjectId ? [
    { name: 'Workspace', path: `/app/projects/${currentProjectId}` },
    { name: 'Requisitos', path: `/app/projects/${currentProjectId}/requirements` },
    { name: 'Diagramas', path: `/app/projects/${currentProjectId}/diagrams` },
    { name: 'Reglas', path: `/app/projects/${currentProjectId}/validation-rules` },
    { name: 'Documentación', path: `/app/projects/${currentProjectId}/reports` },
  ] : [];

  // Legacy fallback links when NOT inside a project (shows "select a project" state on click)
  const legacyNavItems = !currentProjectId ? [
    { name: 'Requisitos', path: '/app/requirements' },
    { name: 'Diagramas', path: '/app/diagrams' },
    { name: 'Reglas', path: '/app/validation-rules' },
  ] : [];

  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-app-border flex flex-col h-full bg-app-secondary">
      {/* App Logo */}
      <div className="h-14 flex items-center px-4 border-b border-app-border">
        <span className="font-semibold text-[15px] app-text-primary tracking-tight">
          SpecAtlas
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {baseNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
                isActive 
                  ? 'bg-[var(--color-accent-subtle)] text-app-accent' 
                  : 'text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary'
              }`}
            >
              {item.name}
            </Link>
          );
        })}

        {/* Project context divider */}
        {currentProjectId && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] uppercase tracking-widest app-text-muted font-semibold">Proyecto</p>
            </div>
            {projectNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
                    isActive 
                      ? 'bg-[var(--color-accent-subtle)] text-app-accent' 
                      : 'text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </>
        )}

        {/* Legacy nav items (without project context) */}
        {legacyNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
                isActive 
                  ? 'bg-[var(--color-accent-subtle)] text-app-accent' 
                  : 'text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section (Bottom) */}
      <div className="p-3 border-t border-app-border space-y-1">
        <AnimatedThemeToggler />
        <button
          onClick={() => logout && logout()}
          className="flex items-center w-full h-8 px-3 rounded-md text-[13px] font-medium text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};
