import { Link } from 'react-router-dom'

// Componente de tarjeta 3D flip - Versión monocromática
function FlipCard({
  title,
  description,
  icon,
  backContent
}: {
  title: string
  description: string
  icon: string
  backContent?: React.ReactNode
}) {
  return (
    <div className="group relative w-full h-80 perspective-1000">
      <div className="relative w-full h-full transition-transform duration-700 transform-style-3d group-hover:rotate-y-180">
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <div className="h-full rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 flex flex-col items-center justify-center text-center hover:border-[var(--color-border-strong)] transition-colors">
            <div className="text-5xl mb-4 opacity-80">{icon}</div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
            <div className="mt-4 text-xs text-[var(--color-text-muted)] opacity-60">Hover para ver más →</div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 backdrop-blur-sm">
            <div className="h-full flex flex-col items-center justify-center text-center">
              {backContent || (
                <>
                  <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4">
                    <span className="text-3xl">{icon}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
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
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Navegación superior */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            SpecAtlas
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium">Problema</a>
            <a href="#solution" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium">Solución</a>
            <a href="#features" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium">Características</a>
            <a href="#tech" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium">Tecnología</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors text-sm">
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] rounded-lg font-medium transition-colors text-sm"
            >
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
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                Análisis de requisitos
                <span className="block text-[var(--color-text-secondary)]">inteligente</span>
                y modelado de software
              </h1>
              <p className="mt-6 text-xl text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                SpecAtlas es una plataforma que transforma texto en especificaciones estructuradas,
                detecta duplicados automáticamente y genera diagramas profesionales.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] rounded-lg text-lg font-semibold transition-all hover:scale-[1.02]"
                >
                  Comenzar gratis
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-card)] rounded-lg text-lg font-semibold transition-all"
                >
                  Ver demostración
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#2B2B2B]" />
                  <div className="w-3 h-3 rounded-full bg-[#565656]" />
                  <div className="w-3 h-3 rounded-full bg-[#848484]" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-[var(--color-surface)] rounded w-3/4" />
                  <div className="h-4 bg-[var(--color-surface)] rounded w-1/2" />
                  <div className="h-4 bg-[var(--color-surface)] rounded w-5/6" />
                  <div className="mt-6 p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)]">
                    <div className="h-3 bg-[var(--color-accent-subtle)] rounded w-1/3 mb-2" />
                    <div className="h-2 bg-[var(--color-surface)] rounded w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              ¿Por qué fallan los proyectos de software?
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
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
              <div key={idx} className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors">
                <div className="text-4xl mb-3 opacity-80">{problem.icon}</div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{problem.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{problem.description}</p>
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
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                SpecAtlas: Análisis
                <span className="block text-[var(--color-text-secondary)]">activo e inteligente</span>
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed">
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
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8">
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-2">Texto original:</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">"El sistema debe ser rápido y fácil de usar"</div>
                  </div>
                  <div className="flex justify-center">
                    <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="p-4 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-border)]">
                    <div className="text-xs text-[var(--color-accent)] mb-2 font-medium">Requisito estructurado:</div>
                    <div className="text-sm text-[var(--color-text-secondary)] space-y-1">
                      <div><strong>Título:</strong> Tiempo de respuesta del sistema</div>
                      <div><strong>Criterio BDD:</strong> Dado que el usuario realiza una acción, cuando el sistema procesa la solicitud, entonces la respuesta debe ser menor a 2 segundos</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-2">⚠️ Ambigüedad detectada: "fácil" sin métrica definida</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with 3D Flip Cards */}
      <section id="features" className="py-20 px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Módulos principales
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Tres pilares fundamentales para el análisis y diseño de software
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FlipCard
              icon="📋"
              title="Gestión de Requisitos"
              description="Conversión de texto libre, validación IEEE 830/ISO 25010, exportación PDF/Excel"
              backContent={
                <>
                  <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Gestión de Requisitos</h4>
                  <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 text-left">
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
              backContent={
                <>
                  <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Análisis y Calidad</h4>
                  <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 text-left">
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
              backContent={
                <>
                  <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Modelado UML</h4>
                  <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 text-left">
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Stack tecnológico
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Arquitectura de triple almacenamiento optimizada para cada tipo de dato
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'PostgreSQL 16',
                description: 'Base de datos relacional principal',
                details: 'Usuarios, proyectos, requisitos, eventos, reglas de validación',
                icon: '🐘'
              },
              {
                name: 'pgvector',
                description: 'Búsqueda semántica vectorial',
                details: 'Embeddings de 768 dimensiones con Gemini text-embedding-004',
                icon: '🔢'
              },
              {
                name: 'Neo4j',
                description: 'Base de datos de grafos',
                details: 'Dependencias entre requisitos y análisis de impacto',
                icon: '🕸️'
              },
              {
                name: 'Google Gemini',
                description: 'Inteligencia Artificial',
                details: 'gemini-2.5-flash para análisis y generación de contenido',
                icon: '✨'
              },
              {
                name: 'Spring Boot 3',
                description: 'Backend Java 21',
                details: 'API REST con Spring Security + JWT para autenticación',
                icon: '🍃'
              },
              {
                name: 'React + TypeScript',
                description: 'Frontend moderno',
                details: 'Vite + Tailwind CSS para una interfaz rápida y responsiva',
                icon: '⚛️'
              }
            ].map((tech, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all hover:scale-[1.02]">
                <div className="text-4xl mb-3 opacity-80">{tech.icon}</div>
                <h3 className="text-lg font-bold mb-2 text-[var(--color-text-primary)]">{tech.name}</h3>
                <p className="text-sm font-medium mb-2 text-[var(--color-text-secondary)]">{tech.description}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{tech.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture: 4 Memories */}
      <section className="py-20 px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Arquitectura de las 4 Memorias
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
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
              <div key={idx} className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors">
                <div className="text-3xl mb-3 opacity-80">{memory.icon}</div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">{memory.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="text-[var(--color-accent)] font-medium">{memory.tech}</div>
                  <div className="text-[var(--color-text-muted)] font-mono text-xs">{memory.table}</div>
                  <div className="text-[var(--color-text-secondary)]">{memory.function}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Comienza a transformar tu proceso de análisis hoy
          </h2>
          <p className="text-xl text-[var(--color-text-secondary)] mb-8">
            Únete a equipos de desarrollo que ya están ahorrando tiempo y mejorando
            la calidad de sus especificaciones con SpecAtlas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] rounded-lg text-lg font-semibold transition-all hover:scale-[1.02]"
            >
              Crear cuenta gratuita
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-card)] rounded-lg text-lg font-semibold transition-all"
            >
              Iniciar sesión
            </Link>
          </div>
          <p className="mt-6 text-[var(--color-text-muted)]">
            Sin tarjeta de crédito • 14 días de prueba gratis • Cumple normas ISO 25010
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            SpecAtlas
          </div>
          <div className="text-[var(--color-text-muted)] text-sm">
            © 2026 SpecAtlas. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-sm">Documentación</a>
            <a href="#" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-sm">GitHub</a>
            <a href="#" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-sm">Contacto</a>
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