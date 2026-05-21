import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "authAccentColor": "#725735",
  "authAccentHover": "#5C452B",
  "authPanelWarmth": "#EFE6D4",
  "authCardRadius": "1.75rem"
}/*EDITMODE-END*/;

const trustPoints = [
  'Mapea requisitos, diagramas y reglas ISO en un flujo trazable.',
  'Conserva memoria del proyecto para reducir ambigüedad técnica.',
  'Diseñado para equipos que documentan decisiones críticas de software.',
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate('/app', { replace: true })
    } catch (loginError) {
      console.error(loginError)
      setError('No pudimos iniciar sesión. Revisa tu correo y contraseña.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-bg)] text-app-text-primary">
      <section className="relative grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--ocd-tweak-auth-panel-warmth,#EFE6D4),transparent_31%),radial-gradient(circle_at_78%_82%,rgba(114,87,53,0.14),transparent_30%)]" />
        <div className="relative hidden border-r border-app-border-strong px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16">
          <Link to="/" className="group inline-flex w-fit items-center gap-3 focus-ring rounded-full">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-app-border-strong bg-app-card shadow-[0_14px_40px_rgba(43,43,43,0.08)]">
              <span className="h-5 w-5 rounded-md bg-[var(--ocd-tweak-auth-accent-color,#725735)] shadow-[inset_0_-6px_0_rgba(255,255,255,0.18)]" />
            </span>
            <span className="text-xl font-black tracking-[-0.04em]">SpecAtles</span>
          </Link>

          <div className="max-w-xl">
            <p className="mb-5 w-fit rounded-full border border-app-border bg-app-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-app-text-secondary">
              Acceso seguro al workspace
            </p>
            <h1 className="text-[clamp(2.7rem,6vw,5.9rem)] font-black leading-[0.92] tracking-[-0.075em] text-app-text-primary">
              Vuelve al mapa vivo de tu software.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-app-text-secondary">
              Entra para continuar refinando requisitos, diagramas y reglas de validación sin perder el contexto técnico del proyecto.
            </p>
          </div>

          <div className="grid gap-3">
            {trustPoints.map((point, index) => (
              <div key={point} className="flex items-start gap-3 rounded-2xl border border-app-border bg-app-card/72 p-4 shadow-[0_18px_50px_rgba(43,43,43,0.06)] backdrop-blur">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--ocd-tweak-auth-panel-warmth,#EFE6D4)] text-xs font-bold text-app-text-primary">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-app-text-secondary">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[29rem] rounded-[var(--ocd-tweak-auth-card-radius,1.75rem)] border border-app-border-strong bg-app-card/92 p-6 shadow-[0_28px_90px_rgba(43,43,43,0.14)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3 focus-ring rounded-full">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-app-border-strong bg-app-card">
                  <span className="h-5 w-5 rounded-md bg-[var(--ocd-tweak-auth-accent-color,#725735)]" />
                </span>
                <span className="text-xl font-black tracking-[-0.04em]">SpecAtles</span>
              </Link>
            </div>

            <div className="mb-7">
              <p className="text-sm font-semibold text-[var(--ocd-tweak-auth-accent-color,#725735)]">Iniciar sesión</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.055em] text-app-text-primary">Continúa tu análisis</h2>
              <p className="mt-3 text-sm leading-6 text-app-text-secondary">Usa tus credenciales para volver al panel de proyectos de SpecAtles.</p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-app-danger/30 bg-app-danger-subtle px-4 py-3 text-sm leading-6 text-app-danger" role="alert">
                {error}
              </div>
            )}

            <form className="grid gap-5" onSubmit={handleSubmit}>
              <Input
                label="Correo electrónico"
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="equipo@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 rounded-xl bg-white/70"
              />
              <Input
                label="Contraseña"
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-12 rounded-xl bg-white/70"
              />

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-app-text-secondary">
                  <input type="checkbox" className="h-4 w-4 rounded border-app-border-strong accent-[var(--ocd-tweak-auth-accent-color,#725735)]" />
                  Mantener sesión
                </label>
                <button type="button" className="font-semibold text-[var(--ocd-tweak-auth-accent-color,#725735)] underline-offset-4 hover:underline focus-ring rounded-md">
                  Recuperar acceso
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="h-12 rounded-xl bg-[var(--ocd-tweak-auth-accent-color,#725735)] text-white shadow-[0_14px_30px_rgba(114,87,53,0.24)] hover:bg-[var(--ocd-tweak-auth-accent-hover,#5C452B)]"
              >
                Entrar a SpecAtles
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-app-text-secondary">
              ¿Aún no tienes cuenta?{' '}
              <Link to="/register" className="font-bold text-[var(--ocd-tweak-auth-accent-color,#725735)] underline-offset-4 hover:underline focus-ring rounded-md">
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
