import React from 'react'; React;

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">SpecAtlas</div>
        <div className="text-xs text-[var(--color-text-muted)]">© 2026 SpecAtlas. Todos los derechos reservados.</div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Documentación</a>
          <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">GitHub</a>
          <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Contacto</a>
        </div>
      </div>
    </footer>
  )
}
