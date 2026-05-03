import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { LoadingAnimation } from '../components/ui/LoadingAnimation'
import ParticleBackground from '../components/ui/ParticleBackground'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [status, setStatus] = useState('Completa el formulario para crear tu cuenta')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsLoading(true)
    setStatus('Por favor espera un momento...')

    try {
      await register({ email, password, name, lastName, phoneNumber, role: 'USER' })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('timeout') || error?.message?.toLowerCase().includes('network')) {
        setStatus('El servidor está tardando más de lo esperado. Intenta nuevamente en unos segundos.')
      } else {
        const backendMsg = error?.message || 'Revisa los datos.';
        setStatus(`No fue posible registrar la cuenta. ${backendMsg}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#0a0a0a] p-6 app-text-primary flex items-center justify-center">
      <ParticleBackground />
      <div className="relative z-10 w-full flex justify-center">
        <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-[#121212]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="text-[15px] app-text-secondary">{status}</p>
        </div>

        {isLoading && <LoadingAnimation />}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              required
              label="Nombre"
              placeholder="Juan"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              required
              label="Apellido"
              placeholder="Pérez"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
          <Input
            required
            type="email"
            label="Correo electrónico"
            placeholder="juan@ejemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            required
            label="Teléfono"
            placeholder="+1 234 567 8900"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
          <Input
            required
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button className="w-full cursor-pointer mt-2" size="lg" type="submit" isLoading={isLoading}>
            Crear cuenta
          </Button>
        </form>

        <p className="text-[13px] text-center app-text-secondary pt-2 border-t border-app-border">
          ¿Ya tienes cuenta?{' '}
          <Link className="text-app-accent hover:text-app-accent-hover font-medium transition-colors" to="/login">
            Inicia sesión
          </Link>
        </p>
        </Card>
      </div>
    </main>
  )
}
