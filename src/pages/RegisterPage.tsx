import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await register({ name, email, password })
      navigate('/login', { replace: true })
    } catch {
      setError('No pudimos crear la cuenta. Revisa los datos e intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-8 text-[var(--color-text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[0_30px_90px_rgba(43,43,43,0.10)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <Link to="/" className="mb-10 inline-flex items-center gap-3 text-lg font-black text-[var(--color-text-primary)] lg:hidden">
              <span className="h-3 w-3 rounded-full bg-[var(--color-accent)]" />
              SpecAtlas
            </Link>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">Crear cuenta</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--color-text-primary)]">Configura tu acceso</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">Crea tu perfil para organizar proyectos, reglas ISO, requisitos y diagramas en un solo lugar.</p>

            <div className="mt-8 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                Nombre
                <input className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-base font-medium outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-subtle)]" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                Correo electrónico
                <input className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-base font-medium outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-subtle)]" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                Contraseña
                <input className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-base font-medium outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-subtle)]" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
              </label>
            </div>

            {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

            <button className="mt-6 min-h-12 w-full rounded-2xl bg-[var(--color-accent)] px-5 font-bold text-[var(--color-accent-foreground)] shadow-[0_14px_30px_rgba(114,87,53,0.22)] transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando…' : 'Crear cuenta'}
            </button>

            <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              ¿Ya tienes cuenta? <Link className="font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]" to="/login">Iniciar sesión</Link>
            </p>
          </form>
        </div>

        <aside className="hidden border-l border-[var(--color-border)] bg-[var(--color-accent-subtle)] p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="inline-flex w-fit items-center gap-3 rounded-full border border-[var(--color-border)] bg-white/55 px-4 py-2 text-sm font-bold text-[var(--color-text-primary)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
            SpecAtlas
          </Link>
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Nuevo workspace</p>
            <h2 className="max-w-md text-4xl font-black leading-[0.96] tracking-tight text-[var(--color-text-primary)] sm:text-5xl">Ordena requisitos antes de construir.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--color-text-secondary)]">SpecAtlas conecta contexto, reglas y modelado para que cada decisión técnica quede trazable.</p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Diseñado para mantener claridad desde el primer requerimiento.</p>
        </aside>
      </section>
    </main>
  )
}

export default RegisterPage
