import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

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
      await register({ email, password, name, lastName, phoneNumber })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch {
      setStatus('No fue posible registrar la cuenta. Revisa los datos.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="text-sm text-slate-300">{status}</p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            required
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            placeholder="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            required
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            placeholder="Apellido"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
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
          <input
            required
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            placeholder="Telefono"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
          <button className="w-full rounded-md bg-indigo-600 px-3 py-2 font-medium" type="submit">
            Crear cuenta
          </button>
        </form>

        <p className="text-sm text-slate-300">
          Ya tienes cuenta?{' '}
          <Link className="text-cyan-400 hover:text-cyan-300" to="/login">
            Inicia sesion
          </Link>
        </p>
      </section>
    </main>
  )
}
