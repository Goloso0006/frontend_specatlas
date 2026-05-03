import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import HeroAIGraph from '../components/ui/KnowledgeGraph'
import DustParticles from '../components/ui/DustParticles'
import DecryptedText from '../components/ui/DecryptedText'
import Typewriter from '../components/ui/Typewriter'
// Componente de tarjeta 3D flip optimizado
function FlipCard({
  title,
  description,
  icon,
  backContent
}: {
  title: string
  description: string
  icon: React.ReactNode
  backContent?: React.ReactNode
}) {
  return (
    <div className="group relative w-full h-80 perspective-1000">
      <div className="relative w-full h-full transition-all duration-700 ease-out transform-style-3d group-hover:rotate-y-180">
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <div className="h-full rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all duration-300 hover:border-[var(--color-border-strong)]">
            <div className="text-5xl mb-5 opacity-80 transition-transform group-hover:scale-105">{icon}</div>
            <h3 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{description}</p>
            <div className="mt-5 text-xs text-[var(--color-text-muted)] opacity-60 flex items-center gap-1">
              <span>Hover para explorar</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] p-6 shadow-inner">
            <div className="h-full flex flex-col items-center justify-center text-center">
              {backContent || (
                <>
                  <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-5">
                    <span className="text-3xl">{icon}</span>
                  </div>
                  <h4 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">{title}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente base Button (simulado pero consistente)
function Button({ children, variant = 'primary', className = '', ...props }: any) {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] disabled:opacity-50"
  const variants = {
    primary: "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] shadow-sm hover:shadow-md",
    secondary: "border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-primary)]"
  }
  return (
    <button className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function HomePage() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [hidePreloader, setHidePreloader] = useState(false);

  const preloaderTextSpeed = 45;
  const preloaderTextIterations = 30;
  const preloaderHoldMs = 900;
  const preloaderFadeMs = 700;

  useEffect(() => {
    // Wait until the decrypted text is likely complete, then fade out smoothly.
    const textDuration = preloaderTextSpeed * preloaderTextIterations;
    const showDuration = textDuration + preloaderHoldMs;

    const startFadeTimer = window.setTimeout(() => setHidePreloader(true), showDuration);
    const removeTimer = window.setTimeout(() => setShowPreloader(false), showDuration + preloaderFadeMs);

    return () => {
      window.clearTimeout(startFadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)] font-s antialiased">
      <DustParticles />

      {showPreloader && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-[#070707] transition-all duration-700 ease-out ${hidePreloader ? 'opacity-0 blur-sm scale-[1.02]' : 'opacity-100'}`}
        >
          <DustParticles count={45} zIndex={48} />
          <div className="relative z-[49] text-center text-white">
            <DecryptedText
              text="Bienvenido a SpecAtlas"
              speed={preloaderTextSpeed}
              maxIterations={preloaderTextIterations}
              className="text-2xl font-bold"
              parentClassName="text-2xl font-bold"
              encryptedClassName="text-2xl font-bold opacity-60"
              animateOn="view"
            />
          </div>
        </div>
      )}

      <div className="relative z-10">
      {/* Navegación superior */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)] bg-clip-text text-transparent">
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
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] rounded-lg font-medium transition-all duration-200 text-sm shadow-sm hover:shadow"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-full lg:max-w-[54%] lg:pr-8">
              <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1 text-xs font-mono text-[var(--color-text-muted)] mb-6">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] mr-2"></span>
                Análisis inteligente v2.0
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                <span className="block">SpecAtlas:</span>
                <span className="block mt-2 break-words">
                  <Typewriter
                    texts={[
                      'Análisis Inteligente',
                      'Modelado de Software',
                      'Arquitectura Escalable'
                    ]}
                    speed={90}
                    deleteSpeed={45}
                    pause={2000}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#4ade80]"
                  />
                </span>
              </h1>
              <p className="mt-6 text-lg text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
                SpecAtlas es una plataforma que transforma texto en especificaciones estructuradas,
                detecta duplicados automáticamente y genera diagramas profesionales.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button variant="primary" asChild>
                  <Link to="/register">Comenzar gratis</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/login">Ver demostración</Link>
                </Button>
              </div>
            </div>
            <HeroAIGraph />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              ¿Por qué fallan los proyectos de software?
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              El 70% de los proyectos fallan no por errores de código, sino por problemas en el análisis
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: (<img src="/iconsHome/noun-confusion-6213917.svg" alt="Ambigüedad" className="w-16 h-16" style={{display: 'inline-block'}} />), title: 'Ambigüedad', description: 'Requisitos poco claros generan diferentes interpretaciones desde el inicio' },
              { icon: (<img src="/iconsHome/noun-ambiguity-8327667.svg" alt="Sin trazabilidad" className="w-16 h-16" style={{display: 'inline-block'}} />), title: 'Sin trazabilidad', description: 'Imposible entender cómo un cambio afecta al resto del sistema' },
              { icon: (<img src="/iconsHome/noun-scrap-paper-4888502.svg" alt="Información fragmentada" className="w-16 h-16" style={{display: 'inline-block'}} />), title: 'Información fragmentada', description: 'Documentación dispersa en múltiples archivos y formatos' },
              { icon: (<img src="/iconsHome/noun-high-cost-7901389.svg" alt="Alto costo de corrección" className="w-16 h-16" style={{display: 'inline-block'}} />), title: 'Alto costo de corrección', description: 'Corregir errores tarde es 100x más costoso que en el análisis' }
            ].map((problem, idx) => (
              <div key={idx} className="group p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all duration-300 hover:shadow-md">
              <div className="text-4xl mb-4 opacity-80 group-hover:scale-105 transition-transform">{problem.icon}</div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{problem.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                SpecAtlas: Análisis
                <span className="block text-[var(--color-text-secondary)]">activo e inteligente</span>
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
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
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mt-0.5">
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
              <div className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-lg">
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <div className="text-xs font-mono text-[var(--color-text-muted)] mb-2">
                      <img src="/iconsHomeSectionSolution/noun-text-5035477.svg" alt="Texto original" className="inline-block w-4 h-4 mr-2 align-text-bottom" />
                      Texto original:
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)] italic">"El sistema debe ser rápido y fácil de usar"</div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-border-strong)]">
                    <div className="text-xs font-mono text-[var(--color-accent)] mb-2 font-semibold"><img src="/iconsHomeSectionSolution/noun-item-7552539.svg" alt="Requisito estructurado" className="inline-block w-4 h-4 mr-2 align-text-bottom" />Requisito estructurado:</div>
                    <div className="text-sm text-[var(--color-text-primary)] space-y-2">
                      <div><span className="font-medium">Título:</span> Tiempo de respuesta del sistema</div>
                      <div><span className="font-medium">Criterio BDD:</span> Dado que el usuario realiza una acción, cuando el sistema procesa la solicitud, entonces la respuesta debe ser menor a 2 segundos</div>
                      <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-card)] p-2 rounded-md mt-2">
                        <img src="/iconsHomeSectionSolution/noun-warning-6740277.svg" alt="Advertencia" className="inline-block w-4 h-4 mr-2 align-text-bottom" />Ambigüedad detectada: "fácil" sin métrica definida
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with 3D Flip Cards */}
      <section id="features" className="relative py-24 px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Módulos principales
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Tres pilares fundamentales para el análisis y diseño de software
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FlipCard
              icon={(<img src="/iconsHomeFlipCard/noun-dependencies-8099254.svg" alt="Gestión de Requisitos" className="w-16 h-16" />)}
              title="Gestión de Requisitos"
              description="Conversión de texto libre, validación IEEE 830/ISO 25010, exportación PDF/Excel"
              backContent={
                <div className="space-y-3 text-left w-full px-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl"><img src="/iconsHomeFlipCard/noun-dependencies-8099254.svg" alt="Gestión de Requisitos" className="w-8 h-8" /></span>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">Gestión de Requisitos</h4>
                  <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 mt-3">
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Conversión texto → requisito</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Validación automática</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Detección de ambigüedades</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Exportación PDF/Excel</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Historial de decisiones</li>
                  </ul>
                </div>
              }
            />
            <FlipCard
              icon={(<img src="/iconsHomeFlipCard/noun-analysis-5915854.svg" alt="Análisis y Calidad" className="w-16 h-16" />)}
              title="Análisis y Calidad"
              description="Búsqueda semántica pgvector, análisis de impacto Neo4j, trazabilidad completa"
              backContent={
                <div className="space-y-3 text-left w-full px-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl"><img src="/iconsHomeFlipCard/noun-analysis-5915854.svg" alt="Análisis y Calidad" className="w-8 h-8" /></span>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">Análisis y Calidad</h4>
                  <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 mt-3">
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Búsqueda semántica (768D)</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Detección de duplicados</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Análisis de impacto</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Grafo de dependencias</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Memoria episódica</li>
                  </ul>
                </div>
              }
            />
            <FlipCard
              icon={(<img src="/iconsHomeFlipCard/noun-uml-8322951.svg" alt="Modelado UML" className="w-16 h-16" />)}
              title="Modelado UML"
              description="Diagramas de casos de uso, clases, secuencia, componentes y despliegue"
              backContent={
                <div className="space-y-3 text-left w-full px-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl"><img src="/iconsHomeFlipCard/noun-uml-8322951.svg" alt="Modelado UML" className="w-8 h-8" /></span>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">Modelado UML</h4>
                  <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 mt-3">
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Casos de uso</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Diagrama de clases</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Secuencias</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Componentes</li>
                    <li className="flex items-center gap-2"><span className="text-[var(--color-accent)]">✓</span> Generación con IA</li>
                  </ul>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Stack tecnológico
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Arquitectura de triple almacenamiento optimizada para cada tipo de dato
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'PostgreSQL 16', description: 'Base de datos relacional principal', details: 'Usuarios, proyectos, requisitos, eventos, reglas de validación', icon: '🐘' },
              { name: 'pgvector', description: 'Búsqueda semántica vectorial', details: 'Embeddings de 768 dimensiones con Gemini text-embedding-004', icon: '🔢' },
              { name: 'Neo4j', description: 'Base de datos de grafos', details: 'Dependencias entre requisitos y análisis de impacto', icon: '🕸️' },
              { name: 'Google Gemini', description: 'Inteligencia Artificial', details: 'gemini-2.5-flash para análisis y generación de contenido', icon: '✨' },
              { name: 'Spring Boot 3', description: 'Backend Java 21', details: 'API REST con Spring Security + JWT para autenticación', icon: '🍃' },
              { name: 'React + TypeScript', description: 'Frontend moderno', details: 'Vite + Tailwind CSS para una interfaz rápida y responsiva', icon: '⚛️' }
            ].map((tech, idx) => (
              <div key={idx} className="group p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="text-4xl mb-4 opacity-80 group-hover:scale-110 transition-transform">{tech.icon}</div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">{tech.name}</h3>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">{tech.description}</p>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{tech.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture: 4 Memories */}
      <section className="py-24 px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Arquitectura de las 4 Memorias
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Modelo cognitivo inspirado en la memoria humana para gestión inteligente de requisitos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Memoria Procedimental', tech: 'PostgreSQL', table: 'validation_rules', function: 'Reglas de validación IEEE 830 / ISO 25010', icon: '📜' },
              { name: 'Memoria Semántica', tech: 'pgvector + Gemini', table: 'requirements.embedding', function: 'Búsqueda por similitud semántica', icon: '🧠' },
              { name: 'Memoria Estructural', tech: 'PostgreSQL + Neo4j', table: 'requirements + grafo', function: 'Dependencias y relaciones', icon: '🏗️' },
              { name: 'Memoria Episódica', tech: 'PostgreSQL', table: 'requirement_events', function: 'Historial completo de cambios', icon: '📅' }
            ].map((memory, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all duration-300 hover:shadow-md">
                <div className="text-3xl mb-4">{memory.icon}</div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">{memory.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="text-[var(--color-accent)] font-mono text-xs">{memory.tech}</div>
                  <div className="text-[var(--color-text-muted)] font-mono text-xs bg-[var(--color-surface)] px-2 py-1 rounded-md">{memory.table}</div>
                  <div className="text-[var(--color-text-secondary)] text-xs">{memory.function}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Comienza a transformar tu proceso de análisis hoy
          </h2>
          <p className="text-xl text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            Únete a equipos de desarrollo que ya están ahorrando tiempo y mejorando
            la calidad de sus especificaciones con SpecAtlas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" asChild>
              <Link to="/register">Crear cuenta gratuita</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-[var(--color-text-muted)]">
            Sin tarjeta de crédito • 14 días de prueba gratis • Cumple normas ISO 25010
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            SpecAtlas
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            © 2026 SpecAtlas. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Documentación</a>
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">GitHub</a>
            <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
      </div>

      {/* Estilos CSS para efectos 3D */}
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
        .group:hover .group-hover\\:rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </main>
  )
}

export default HomePage