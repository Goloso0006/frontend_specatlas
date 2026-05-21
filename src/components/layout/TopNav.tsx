import { Link } from 'react-router-dom'

const navItems = [
  { href: '#problem', label: 'Riesgo' },
  { href: '#solution', label: 'Flujo' },
  { href: '#features', label: 'Módulos' },
  { href: '#tech', label: 'Arquitectura' }
]

export default function TopNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/82 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--color-bg)]/68">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-3 rounded-full focus-ring">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_18px_var(--color-accent)]" />
          </span>
          <span className="text-xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">SpecAtlas</span>
        </Link>
        <div className="hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)]/70 p-1 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] focus-ring">
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] focus-ring sm:inline-flex">Entrar</Link>
          <Link to="/register" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--color-accent-foreground)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] hover:shadow-md focus-ring">Crear cuenta</Link>
        </div>
      </div>
    </nav>
  )
}
