import { Link } from 'react-router-dom'

// Componente de tarjeta 3D flip
function FlipCard({
  title,
  description,
  icon,
  frontColor = "from-indigo-500/20 to-emerald-500/20",
  backContent
}: {
  title: string
  description: string
  icon: string
  frontColor?: string
  backContent?: React.ReactNode
}) {
  return (
    <div className="group relative w-full h-80 perspective-1000">
      <div className="relative w-full h-full transition-transform duration-700 transform-style-3d group-hover:rotate-y-180">
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <div className={`h-full rounded-2xl bg-gradient-to-br ${frontColor} border border-slate-700/50 p-6 flex flex-col items-center justify-center text-center hover:border-slate-600 transition-colors`}>
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
            <div className="mt-4 text-xs text-slate-500">Hover para ver más →</div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full rounded-2xl bg-slate-900/90 border border-slate-700 p-6 backdrop-blur-sm">
            <div className="h-full flex flex-col items-center justify-center text-center">
              {backContent || (
                <>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-emerald-500/30 flex items-center justify-center mb-4">
                    <span className="text-3xl">{icon}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-100 mb-2">{title}</h4>
                  <p className="text-sm text-slate-400">{description}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navegación superior */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            SpecAtlas
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-slate-300 hover:text-white transition-colors">Problema</a>
            <a href="#solution" className="text-slate-300 hover:text-white transition-colors">Solución</a>
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Características</a>
            <a href="#tech" className="text-slate-300 hover:text-white transition-colors">Tecnología</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors">
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
                <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                  inteligente
                </span>{' '}
                y modelado de software
              </h1>
              <p className="mt-6 text-xl text-slate-300 max-w-2xl">
                SpecAtlas es una plataforma que transforma texto en especificaciones estructuradas,
                detecta duplicados automáticamente y genera diagramas profesionales.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-semibold transition-all hover:scale-105"
                >
                  Comenzar gratis
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 border border-slate-700 hover:border-slate-600 rounded-lg text-lg font-semibold transition-all"
                >
                  Ver demostración
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                  <div className="h-4 bg-slate-800 rounded w-5/6" />
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="h-3 bg-indigo-500/30 rounded w-1/3 mb-2" />
                    <div className="h-2 bg-slate-700 rounded w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              ¿Por qué fallan los proyectos de software?
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              El 70% de los proyectos fallan no por errores de código, sino por problemas en el análisis
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '❓',
                title: 'Ambigüedad',
                description: 'Requisitos poco claros generan diferentes interpretaciones desde el inicio'
              },
              {
                icon: '🔗',
                title: 'Sin trazabilidad',
                description: 'Imposible entender cómo un cambio afecta al resto del sistema'
              },
              {
                icon: '📄',
                title: 'Información fragmentada',
                description: 'Documentación dispersa en múltiples archivos y formatos'
              },
              {
                icon: '💰',
                title: 'Alto costo de corrección',
                description: 'Corregir errores tarde es 100x más costoso que en el análisis'
              }
            ].map((problem, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-red-500/30 transition-colors">
                <div className="text-4xl mb-3">{problem.icon}</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{problem.title}</h3>
                <p className="text-sm text-slate-400">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                SpecAtlas: Análisis{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                  activo e inteligente
                </span>
              </h2>
              <p className="text-lg text-slate-300 mb-6">
                A diferencia de herramientas que solo almacenan requisitos, SpecAtlas es un entorno
                activo que analiza, valida y cuestiona la información usando IA.
              </p>
              <div className="space-y-4">
                {[
                  'Convierte texto libre en requisitos estructurados en <10 segundos',
                  'Detecta ambigüedades automáticamente (IEEE 830 / ISO 25010)',
                  'Búsqueda semántica con pgvector (768 dimensiones)',
                  'Análisis de impacto con grafos de dependencias (Neo4j)',
                  'Generación de diagramas UML con IA (Google Gemini 2.5 Flash)'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="text-xs text-slate-500 mb-2">Texto original:</div>
                    <div className="text-sm text-slate-300">"El sistema debe ser rápido y fácil de usar"</div>
                  </div>
                  <div className="flex justify-center">
                    <svg className="w-6 h-6 text-indigo-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-xs text-emerald-400 mb-2">Requisito estructurado:</div>
                    <div className="text-sm text-slate-300 space-y-1">
                      <div><strong>Título:</strong> Tiempo de respuesta del sistema</div>
                      <div><strong>Criterio BDD:</strong> Dado que el usuario realiza una acción, cuando el sistema procesa la solicitud, entonces la respuesta debe ser menor a 2 segundos</div>
                      <div className="text-xs text-amber-400 mt-2">⚠️ Ambigüedad detectada: "fácil" sin métrica definida</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with 3D Flip Cards */}
      <section id="features" className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Módulos principales
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Tres pilares fundamentales para el análisis y diseño de software
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FlipCard
              icon="📋"
              title="Gestión de Requisitos"
              description="Conversión de texto libre, validación IEEE 830/ISO 25010, exportación PDF/Excel"
              frontColor="from-indigo-500/20 to-blue-500/20"
              backContent={
                <>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 flex items-center justify-center mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-100 mb-3">Gestión de Requisitos</h4>
                  <ul className="text-sm text-slate-400 space-y-2 text-left">
                    <li>✓ Conversión texto → requisito</li>
                    <li>✓ Validación automática</li>
                    <li>✓ Detección de ambigüedades</li>
                    <li>✓ Exportación PDF/Excel</li>
                    <li>✓ Historial de decisiones</li>
                  </ul>
                </>
              }
            />

            <FlipCard
              icon="🔍"
              title="Análisis y Calidad"
              description="Búsqueda semántica pgvector, análisis de impacto Neo4j, trazabilidad completa"
              frontColor="from-emerald-500/20 to-cyan-500/20"
              backContent={
                <>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-100 mb-3">Análisis y Calidad</h4>
                  <ul className="text-sm text-slate-400 space-y-2 text-left">
                    <li>✓ Búsqueda semántica (768D)</li>
                    <li>✓ Detección de duplicados</li>
                    <li>✓ Análisis de impacto</li>
                    <li>✓ Grafo de dependencias</li>
                    <li>✓ Memoria episódica</li>
                  </ul>
                </>
              }
            />

            <FlipCard
              icon="📊"
              title="Modelado UML"
              description="Diagramas de casos de uso, clases, secuencia, componentes y despliegue"
              frontColor="from-violet-500/20 to-purple-500/20"
              backContent={
                <>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center mb-4">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-100 mb-3">Modelado UML</h4>
                  <ul className="text-sm text-slate-400 space-y-2 text-left">
                    <li>✓ Casos de uso</li>
                    <li>✓ Diagrama de clases</li>
                    <li>✓ Secuencias</li>
                    <li>✓ Componentes</li>
                    <li>✓ Generación con IA</li>
                  </ul>
                </>
              }
            />
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Stack tecnológico
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Arquitectura de triple almacenamiento optimizada para cada tipo de dato
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'PostgreSQL 16',
                description: 'Base de datos relacional principal',
                details: 'Usuarios, proyectos, requisitos, eventos, reglas de validación',
                icon: '🐘',
                color: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
              },
              {
                name: 'pgvector',
                description: 'Búsqueda semántica vectorial',
                details: 'Embeddings de 768 dimensiones con Gemini text-embedding-004',
                icon: '🔢',
                color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              },
              {
                name: 'Neo4j',
                description: 'Base de datos de grafos',
                details: 'Dependencias entre requisitos y análisis de impacto',
                icon: '🕸️',
                color: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
              },
              {
                name: 'Google Gemini',
                description: 'Inteligencia Artificial',
                details: 'gemini-2.5-flash para análisis y generación de contenido',
                icon: '✨',
                color: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
              },
              {
                name: 'Spring Boot 3',
                description: 'Backend Java 21',
                details: 'API REST con Spring Security + JWT para autenticación',
                icon: '🍃',
                color: 'bg-green-500/20 border-green-500/30 text-green-400'
              },
              {
                name: 'React + TypeScript',
                description: 'Frontend moderno',
                details: 'Vite + Tailwind CSS para una interfaz rápida y responsiva',
                icon: '⚛️',
                color: 'bg-sky-500/20 border-sky-500/30 text-sky-400'
              }
            ].map((tech, idx) => (
              <div key={idx} className={`p-6 rounded-xl border ${tech.color} bg-opacity-20 hover:scale-105 transition-transform`}>
                <div className="text-4xl mb-3">{tech.icon}</div>
                <h3 className="text-lg font-bold mb-2">{tech.name}</h3>
                <p className="text-sm font-medium mb-2">{tech.description}</p>
                <p className="text-xs opacity-80">{tech.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture: 4 Memories */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Arquitectura de las 4 Memorias
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Modelo cognitivo inspirado en la memoria humana para gestión inteligente de requisitos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Memoria Procedimental',
                tech: 'PostgreSQL',
                table: 'validation_rules',
                function: 'Reglas de validación IEEE 830 / ISO 25010',
                icon: '📜'
              },
              {
                name: 'Memoria Semántica',
                tech: 'pgvector + Gemini',
                table: 'requirements.embedding',
                function: 'Búsqueda por similitud semántica',
                icon: '🧠'
              },
              {
                name: 'Memoria Estructural',
                tech: 'PostgreSQL + Neo4j',
                table: 'requirements + grafo',
                function: 'Dependencias y relaciones',
                icon: '🏗️'
              },
              {
                name: 'Memoria Episódica',
                tech: 'PostgreSQL',
                table: 'requirement_events',
                function: 'Historial completo de cambios',
                icon: '📅'
              }
            ].map((memory, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                <div className="text-3xl mb-3">{memory.icon}</div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">{memory.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="text-indigo-400 font-medium">{memory.tech}</div>
                  <div className="text-slate-500 font-mono text-xs">{memory.table}</div>
                  <div className="text-slate-400">{memory.function}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Comienza a transformar tu proceso de análisis hoy
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Únete a equipos de desarrollo que ya están ahorrando tiempo y mejorando
            la calidad de sus especificaciones con SpecAtlas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-semibold transition-all hover:scale-105"
            >
              Crear cuenta gratuita
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 border border-slate-700 hover:border-slate-600 rounded-lg text-lg font-semibold transition-all"
            >
              Iniciar sesión
            </Link>
          </div>
          <p className="mt-6 text-slate-400">
            Sin tarjeta de crédito • 14 días de prueba gratis • Cumple normas ISO 25010
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            SpecAtlas
          </div>
          <div className="text-slate-400 text-sm">
            © 2026 SpecAtlas. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Documentación</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>

      {/* Estilos CSS personalizados para las tarjetas 3D */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .group:hover .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </main>
  )
}

export default HomePage