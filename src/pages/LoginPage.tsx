import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    try {
      await login({ email, password })
      const target = state?.from || '/app'
      navigate(target, { replace: true })
    } catch {
      setStatus('No fue posible iniciar sesion. Verifica credenciales.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-slate-300">{status}</p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            required
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            required
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="w-full rounded-md bg-emerald-600 px-3 py-2 font-medium" type="submit">
            Entrar
          </button>
        </form>

        <p className="text-sm text-slate-300">
          No tienes cuenta?{' '}
          <Link className="text-cyan-400 hover:text-cyan-300" to="/register">
            Registrate
          </Link>
        </p>
      </section>
    </main>
  )
}
