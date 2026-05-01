import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-lg">
        <h1 className="text-4xl font-bold">SpecAtlas</h1>
        <p className="mt-2 text-slate-300">Plataforma inteligente para análisis de requisitos y modelado de software</p>

        <p className="mt-4 text-slate-200">SpecAtlas te permite gestionar proyectos, convertir texto en requisitos, detectar duplicados, analizar relaciones y generar diagramas.</p>

        <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-start">
          <Link to="/login" className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-center">Iniciar sesión</Link>
          <Link to="/register" className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-center">Crear cuenta</Link>
        </div>
      </section>
    </main>
  )
}

export default HomePage
