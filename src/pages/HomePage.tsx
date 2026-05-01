import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <main className="relative min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 overflow-hidden">
      {/* Decoración de fondo sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <section className="relative z-10 mx-auto w-full max-w-3xl rounded-2xl border border-slate-800/50 bg-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              SpecAtlas
            </span>
          </h1>
          <p className="mt-3 text-lg text-slate-300 max-w-xl mx-auto">
            Plataforma inteligente para análisis de requisitos y modelado de software
          </p>
        </div>

        {/* Tarjetas de valor rápido */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 transition-colors duration-200">
            <h3 className="font-semibold text-indigo-300">Requisitos</h3>
            <p className="text-sm text-slate-400 mt-1">Convierte texto en especificaciones estructuradas</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-emerald-500/30 transition-colors duration-200">
            <h3 className="font-semibold text-emerald-300">Análisis</h3>
            <p className="text-sm text-slate-400 mt-1">Detecta duplicados y relaciones automáticamente</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-sky-500/30 transition-colors duration-200">
            <h3 className="font-semibold text-sky-300">Diagramas</h3>
            <p className="text-sm text-slate-400 mt-1">Genera modelos visuales al instante</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    </main>
  )
}

export default HomePage