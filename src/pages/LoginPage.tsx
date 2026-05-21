import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate('/app', { replace: true })
    } catch {
      setError('No pudimos iniciar sesión. Revisa tu correo y contraseña.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-8 text-[var(--color-text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[0_30px_90px_rgba(43,43,43,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="hidden border-r border-[var(--color-border)] bg-[var(--color-accent-subtle)] p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="inline-flex w-fit items-center gap-3 rounded-full border border-[var(--color-border)] bg-white/55 px-4 py-2 text-sm font-bold text-[var(--color-text-primary)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
            SpecAtlas
          </Link>
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Acceso seguro</p>
            <h1 className="max-w-md text-4xl font-black leading-[0.96] tracking-tight text-[var(--color-text-primary)] sm:text-5xl">Vuelve a tu mapa de requisitos.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--color-text-secondary)]">Continúa documentando reglas ISO, decisiones técnicas y diagramas desde el último proyecto trabajado.</p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Sistema cálido, técnico y sin distracciones para equipos de análisis.</p>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <Link to="/" className="mb-10 inline-flex items-center gap-3 text-lg font-black text-[var(--color-text-primary)] lg:hidden">
              <span className="h-3 w-3 rounded-full bg-[var(--color-accent)]" />
              SpecAtlas
            </Link>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">Iniciar sesión</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--color-text-primary)]">Entra a tu workspace</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">Usa tus credenciales para abrir tus proyectos y requerimientos guardados.</p>

            <div className="mt-8 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                Correo electrónico
                <input className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-base font-medium outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-subtle)]" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                Contraseña
                <input className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-base font-medium outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-subtle)]" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
              </label>
            </div>

            {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

            <button className="mt-6 min-h-12 w-full rounded-2xl bg-[var(--color-accent)] px-5 font-bold text-[var(--color-accent-foreground)] shadow-[0_14px_30px_rgba(114,87,53,0.22)] transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </button>

            <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              ¿Aún no tienes cuenta? <Link className="font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]" to="/register">Crear cuenta</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
