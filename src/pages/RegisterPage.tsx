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

const onboardingSteps = [
  'Crea tu espacio de trabajo',
  'Registra proyectos y reglas ISO',
  'Genera trazabilidad y diagramas',
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({ name, email, password })
      navigate('/login', { replace: true })
    } catch (registerError) {
      console.error(registerError)
      setError('No pudimos crear la cuenta. Intenta con otro correo o vuelve a probar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-bg)] text-app-text-primary">
      <section className="relative grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,var(--ocd-tweak-auth-panel-warmth,#EFE6D4),transparent_30%),radial-gradient(circle_at_18%_82%,rgba(114,87,53,0.15),transparent_31%)]" />

        <div className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[31rem] rounded-[var(--ocd-tweak-auth-card-radius,1.75rem)] border border-app-border-strong bg-app-card/92 p-6 shadow-[0_28px_90px_rgba(43,43,43,0.14)] backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <Link to="/" className="inline-flex items-center gap-3 focus-ring rounded-full">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-app-border-strong bg-app-card">
                  <span className="h-5 w-5 rounded-md bg-[var(--ocd-tweak-auth-accent-color,#725735)] shadow-[inset_0_-6px_0_rgba(255,255,255,0.18)]" />
                </span>
                <span className="text-xl font-black tracking-[-0.04em]">SpecAtles</span>
              </Link>
            </div>

            <div className="mb-7">
              <p className="text-sm font-semibold text-[var(--ocd-tweak-auth-accent-color,#725735)]">Crear cuenta</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] text-app-text-primary">Empieza con un workspace claro</h1>
              <p className="mt-3 text-sm leading-6 text-app-text-secondary">Configura tu acceso para convertir requisitos en decisiones trazables dentro de SpecAtles.</p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-app-danger/30 bg-app-danger-subtle px-4 py-3 text-sm leading-6 text-app-danger" role="alert">
                {error}
              </div>
            )}

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input
                label="Nombre del equipo o responsable"
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Equipo de arquitectura"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="h-12 rounded-xl bg-white/70"
              />
              <Input
                label="Correo electrónico"
                id="register-email"
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
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-12 rounded-xl bg-white/70"
              />
              <Input
                label="Confirmar contraseña"
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="h-12 rounded-xl bg-white/70"
              />

              <div className="rounded-2xl border border-app-border bg-[var(--ocd-tweak-auth-panel-warmth,#EFE6D4)] p-4 text-sm leading-6 text-app-text-secondary">
                Al crear tu cuenta aceptas usar SpecAtles para documentar requisitos, reglas y diagramas de tu propio proyecto.
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="mt-1 h-12 rounded-xl bg-[var(--ocd-tweak-auth-accent-color,#725735)] text-white shadow-[0_14px_30px_rgba(114,87,53,0.24)] hover:bg-[var(--ocd-tweak-auth-accent-hover,#5C452B)]"
              >
                Crear cuenta en SpecAtles
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-app-text-secondary">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-bold text-[var(--ocd-tweak-auth-accent-color,#725735)] underline-offset-4 hover:underline focus-ring rounded-md">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>

        <aside className="relative hidden border-l border-app-border-strong px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="ml-auto w-fit rounded-full border border-app-border bg-app-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-app-text-secondary">
            Nuevo workspace técnico
          </div>

          <div className="max-w-xl">
            <h2 className="text-[clamp(2.6rem,5.8vw,5.7rem)] font-black leading-[0.92] tracking-[-0.075em] text-app-text-primary">
              Diseña evidencia antes de escribir código.
            </h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-app-text-secondary">
              SpecAtles ordena las piezas críticas del análisis: intención, reglas, riesgos y relaciones entre módulos.
            </p>
          </div>

          <div className="grid gap-3">
            {onboardingSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-2xl border border-app-border bg-app-card/72 p-4 shadow-[0_18px_50px_rgba(43,43,43,0.06)] backdrop-blur">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--ocd-tweak-auth-panel-warmth,#EFE6D4)] text-sm font-black text-app-text-primary">
                  0{index + 1}
                </span>
                <div>
                  <p className="font-semibold tracking-[-0.02em] text-app-text-primary">{step}</p>
                  <p className="mt-1 text-sm text-app-text-secondary">Paso recomendado para equipos con documentación viva.</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  )
}
