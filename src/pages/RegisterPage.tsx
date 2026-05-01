import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [status, setStatus] = useState('Completa el formulario para crear tu cuenta')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    try {
      await register({ email, password, name, lastName, phoneNumber, role: 'USER' })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (error: any) {
      const backendMsg = error?.message || 'Revisa los datos.';
      setStatus(`No fue posible registrar la cuenta. ${backendMsg}`)
    }
  }

  return (
    <main className="min-h-screen app-bg p-6 app-text-primary flex items-center justify-center">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="text-[15px] app-text-secondary">{status}</p>
        </div>

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
          <Button className="w-full mt-2" size="lg" type="submit">
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
    </main>
  )
}
