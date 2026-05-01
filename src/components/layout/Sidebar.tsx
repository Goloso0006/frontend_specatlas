import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/app' },
    { name: 'Proyectos', path: '/app/projects' },
    { name: 'Requisitos', path: '/app/requirements' },
    { name: 'Diagramas', path: '/app/diagrams' },
    { name: 'Reglas', path: '/app/validation-rules' },
  ];

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
        {navItems.map((item) => {
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
      <div className="p-3 border-t border-app-border">
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
