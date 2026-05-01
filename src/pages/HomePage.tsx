import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <main className="min-h-screen app-bg app-text-primary">
      {/* Navegación superior */}
      <nav className="fixed top-0 left-0 right-0 z-50 app-bg/80 backdrop-blur-md border-b app-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] bg-clip-text text-transparent">
            SpecAtlas
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="app-text-secondary hover:text-white transition-colors">Características</a>
            <a href="#how-it-works" className="app-text-secondary hover:text-white transition-colors">Cómo funciona</a>
            <a href="#benefits" className="app-text-secondary hover:text-white transition-colors">Beneficios</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="app-text-secondary hover:text-white font-medium transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/register" className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-app-accent-foreground rounded-lg font-medium transition-colors">
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Análisis de requisitos{' '}
                <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] bg-clip-text text-transparent">
                  inteligente
                </span>{' '}
                y modelado de software
              </h1>
              <p className="mt-6 text-xl app-text-secondary max-w-2xl">
                SpecAtlas es una plataforma que transforma texto en especificaciones estructuradas, 
                detecta duplicados automáticamente y genera diagramas profesionales.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-app-accent hover:bg-app-accent-hover text-app-accent-foreground rounded-lg text-lg font-semibold transition-all hover:scale-105"
                >
                  Comenzar gratis
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 border app-border-strong hover:border-slate-600 rounded-lg text-lg font-semibold transition-all"
                >
                  Ver demostración
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-success)]/20 rounded-3xl blur-3xl" />
              <div className="relative app-card border app-border rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 app-surface rounded w-3/4" />
                  <div className="h-4 app-surface rounded w-1/2" />
                  <div className="h-4 app-surface rounded w-5/6" />
                  <div className="mt-6 p-4 app-surface/50 rounded-lg border app-border-strong">
                    <div className="h-3 bg-app-accent-subtle rounded w-1/3 mb-2" />
                    <div className="h-2 app-border-strong rounded w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 app-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Todo lo que necesitas para{' '}
              <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] bg-clip-text text-transparent">
                gestionar requisitos
              </span>
            </h2>
            <p className="mt-4 text-xl app-text-secondary max-w-3xl mx-auto">
              Herramientas poderosas diseñadas para equipos de desarrollo que buscan precisión y eficiencia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Conversión automática',
                description: 'Transforma texto libre en requisitos estructurados con validación inteligente y detección de ambigüedades.',
                icon: '📝',
                color: 'accent'
              },
              {
                title: 'Detección de duplicados',
                description: 'Identifica requisitos redundantes automáticamente usando análisis semántico avanzado.',
                icon: '🔍',
                color: 'emerald'
              },
              {
                title: 'Análisis de relaciones',
                description: 'Mapea dependencias y conexiones entre requisitos para mantener la coherencia del proyecto.',
                icon: '🔗',
                color: 'accent'
              },
              {
                title: 'Diagramas automáticos',
                description: 'Genera diagramas UML, de casos de uso y flujos de proceso a partir de tus especificaciones.',
                icon: '📊',
                color: 'violet'
              },
              {
                title: 'Trazabilidad completa',
                description: 'Sigue el ciclo de vida completo de cada requisito desde la concepción hasta la implementación.',
                icon: '📈',
                color: 'amber'
              },
              {
                title: 'Colaboración en tiempo real',
                description: 'Trabaja con tu equipo simultáneamente con comentarios, versionado y control de cambios.',
                icon: '👥',
                color: 'rose'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl app-surface/40 border app-border-strong/50 hover:border-slate-600 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 app-text-primary">{feature.title}</h3>
                <p className="app-text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Cómo funciona
            </h2>
            <p className="mt-4 text-xl app-text-secondary">
              Tres pasos simples para transformar tu proceso de análisis
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Importa o escribe',
                description: 'Carga documentos existentes o escribe directamente tus ideas en lenguaje natural.'
              },
              {
                step: '02',
                title: 'Analiza y estructura',
                description: 'Nuestro motor IA organiza, valida y estructura automáticamente el contenido.'
              },
              {
                step: '03',
                title: 'Exporta y comparte',
                description: 'Genera documentación profesional, diagramas y reportes listos para tu equipo.'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-7xl font-bold text-slate-800 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="app-text-muted text-lg">{item.description}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 right-0 transform translate-x-1/2">
                    <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6 app-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                ¿Por qué elegir{' '}
                <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] bg-clip-text text-transparent">
                  SpecAtlas?
                </span>
              </h2>
              <div className="space-y-6">
                {[
                  'Reduce el tiempo de análisis en un 70%',
                  'Elimina errores humanos en la especificación',
                  'Integración con herramientas populares (Jira, Confluence, GitHub)',
                  'Soporte para múltiples metodologías (Ágil, Cascada, Híbrido)',
                  'Exportación a formatos estándar (PDF, Word, XML, JSON)'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg app-text-secondary">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-success)]/20 rounded-3xl blur-3xl" />
              <div className="relative app-surface border app-border-strong rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 app-card rounded-lg">
                    <div>
                      <div className="font-semibold">Proyecto Alpha</div>
                      <div className="text-sm app-text-muted">142 requisitos</div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                      98% completo
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 app-card rounded-lg">
                    <div>
                      <div className="font-semibold">Sistema Beta</div>
                      <div className="text-sm app-text-muted">87 requisitos</div>
                    </div>
                    <div className="px-3 py-1 bg-app-accent-subtle text-app-accent rounded-full text-sm">
                      En progreso
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 app-card rounded-lg">
                    <div>
                      <div className="font-semibold">Módulo Gamma</div>
                      <div className="text-sm app-text-muted">203 requisitos</div>
                    </div>
                    <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                      Revisión
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Comienza a transformar tu proceso hoy
          </h2>
          <p className="text-xl app-text-secondary mb-8">
            Únete a equipos de desarrollo que ya están ahorrando tiempo y mejorando la calidad de sus especificaciones
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-app-accent hover:bg-app-accent-hover text-app-accent-foreground rounded-lg text-lg font-semibold transition-all hover:scale-105"
            >
              Crear cuenta gratuita
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 border app-border-strong hover:border-slate-600 rounded-lg text-lg font-semibold transition-all"
            >
              Iniciar sesión
            </Link>
          </div>
          <p className="mt-6 app-text-muted">Sin tarjeta de crédito • 14 días de prueba gratis</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t app-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-bold bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] bg-clip-text text-transparent">
            SpecAtlas
          </div>
          <div className="app-text-muted text-sm">
            © 2026 SpecAtlas. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="app-text-muted hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="app-text-muted hover:text-white transition-colors">Términos</a>
            <a href="#" className="app-text-muted hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default HomePage