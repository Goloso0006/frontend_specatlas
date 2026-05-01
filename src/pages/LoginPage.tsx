import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { LoadingAnimation } from '../components/ui/LoadingAnimation'

interface LoginLocationState {
  from?: string
  registered?: boolean
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const state = (location.state as LoginLocationState | null) ?? null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState(
    state?.registered
      ? 'Registro exitoso. Inicia sesion para continuar.'
      : 'Ingresa tus credenciales',
  )
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsLoading(true)
    setStatus('Por favor espera un momento...')

    try {
      await login({ email, password })
      const target = state?.from || '/app'
      navigate(target, { replace: true })
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('timeout') || error?.message?.toLowerCase().includes('network')) {
        setStatus('El servidor está tardando más de lo esperado. Intenta nuevamente en unos segundos.')
      } else {
        setStatus('No fue posible iniciar sesion. Verifica credenciales.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen app-bg p-6 app-text-primary flex items-center justify-center">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Iniciar Sesión</h1>
          <p className="text-[15px] app-text-secondary">{status}</p>
        </div>
        
        {isLoading && <LoadingAnimation />}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              required
              type="email"
              label="Correo electrónico"
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              required
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button className="w-full" size="lg" type="submit" isLoading={isLoading}>
            Entrar
          </Button>
        </form>

        <p className="text-[13px] text-center app-text-secondary pt-2 border-t border-app-border">
          ¿No tienes cuenta?{' '}
          <Link className="text-app-accent hover:text-app-accent-hover font-medium transition-colors" to="/register">
            Regístrate aquí
          </Link>
        </p>
      </Card>
    </main>
  )
}
