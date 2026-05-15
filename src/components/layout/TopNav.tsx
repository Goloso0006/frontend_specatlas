import { Link } from 'react-router-dom'
import React from 'react'; React;

export default function TopNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)] bg-clip-text text-transparent">
          SpecAtlas
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#problem" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium">Problema</a>
          <a href="#solution" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium">Solución</a>
          <a href="#features" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium">Características</a>
          <a href="#tech" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium">Tecnología</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors text-sm">Iniciar sesión</Link>
          <Link to="/register" className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] rounded-lg font-medium transition-all duration-200 text-sm shadow-sm hover:shadow">Crear cuenta</Link>
        </div>
      </div>
    </nav>
  )
}
