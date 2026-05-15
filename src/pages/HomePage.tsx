import { Link } from 'react-router-dom'
import DustParticles from '../components/ui/DustParticles'
import FlipCard from '../components/ui/FlipCard'
import { Button } from '../components/ui/Button'
import TopNav from '../components/layout/TopNav'
import SiteFooter from '../components/layout/SiteFooter'
import PreloaderOverlay from '../components/ui/PreloaderOverlay'
import usePreloader from '../hooks/usePreloader'
import HeroSection from '../components/sections/HeroSection'
import '../styles/flipcard.css'

export default function HomePage() {
  const { show, hide } = usePreloader()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased">
      <DustParticles />

      <TopNav />
      <PreloaderOverlay show={show} hide={hide} />

      <div className="relative z-10">
        <HeroSection />

        <section id="problem" className="py-24 px-6 bg-[var(--color-bg-secondary)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">¿Por qué fallan los proyectos de software?</h2>
              <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">El 70% de los proyectos fallan no por errores de código, sino por problemas en el análisis</p>
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

        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Módulos principales</h2>
              <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">Tres pilares fundamentales para el análisis y diseño de software</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FlipCard
                icon={(<img src="/iconsHomeFlipCard/noun-dependencies-8099254.svg" alt="Gestión de Requisitos" className="w-16 h-16" />)}
                title="Gestión de Requisitos"
                description="Conversión de texto libre, validación IEEE 830/ISO 25010, exportación PDF/Excel"
                backContent={(
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
                )}
              />

              <FlipCard
                icon={(<img src="/iconsHomeFlipCard/noun-analysis-5915854.svg" alt="Análisis y Calidad" className="w-16 h-16" />)}
                title="Análisis y Calidad"
                description="Búsqueda semántica pgvector, análisis de impacto Neo4j, trazabilidad completa"
                backContent={(
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
                )}
              />

              <FlipCard
                icon={(<img src="/iconsHomeFlipCard/noun-uml-8322951.svg" alt="Modelado UML" className="w-16 h-16" />)}
                title="Modelado UML"
                description="Diagramas de casos de uso, clases, secuencia, componentes y despliegue"
                backContent={(
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
                )}
              />
            </div>
          </div>
        </section>

        <section id="tech" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Stack tecnológico</h2>
              <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">Arquitectura de triple almacenamiento optimizada para cada tipo de dato</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'PostgreSQL 16', description: 'Base de datos relacional principal', details: 'Usuarios, proyectos, requisitos, eventos, reglas de validación', icon: (<img src="/iconHomeTechStack/noun-postgresql-3451760.svg" alt="PostgreSQL" className="w-15 h-15 object-contain" />) },
                { name: 'pgvector', description: 'Búsqueda semántica vectorial', details: 'Embeddings de 768 dimensiones con Gemini text-embedding-004', icon: (<img src="/iconHomeTechStack/noun-vector-8224612.svg" alt="pgvector" className="w-14 h-14 object-contain" />) },
                { name: 'Neo4j', description: 'Base de datos de grafos', details: 'Dependencias entre requisitos y análisis de impacto', icon: (<img src="/iconHomeTechStack/noun-spiderweb-8078963.svg" alt="Neo4j" className="w-14 h-14 object-contain" />) },
                { name: 'Google Gemini', description: 'Inteligencia Artificial', details: 'gemini-2.5-flash para análisis y generación de contenido', icon: (<img src="/iconHomeTechStack/noun-artificial-8234436.svg" alt="Google Gemini" className="w-13 h-13 object-contain" />) },
                { name: 'Spring Boot 3', description: 'Backend Java 21', details: 'API REST con Spring Security + JWT para autenticación', icon: (<img src="/iconHomeTechStack/noun-power-button-8306535.svg" alt="Spring Boot 3" className="w-13 h-13 object-contain" />) },
                { name: 'React + TypeScript', description: 'Frontend moderno', details: 'Vite + Tailwind CSS para una interfaz rápida y responsiva', icon: (<img src="/iconHomeTechStack/noun-atom-8190848.svg" alt="React + TypeScript" className="w-13 h-13 object-contain" />) }
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

        <section className="py-24 px-6 bg-[var(--color-bg-secondary)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Arquitectura de las 4 Memorias</h2>
              <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">Modelo cognitivo inspirado en la memoria humana para gestión inteligente de requisitos</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Memoria Procedimental', tech: 'PostgreSQL', table: 'validation_rules', function: 'Reglas de validación IEEE 830 / ISO 25010', icon: (<img src="/iconHomeArchitecture/noun-memory-8182813.svg" alt="Memoria Procedimental" className="w-8 h-8 object-contain" />) },
                { name: 'Memoria Semántica', tech: 'pgvector + Gemini', table: 'requirements.embedding', function: 'Búsqueda por similitud semántica', icon: (<img src="/iconHomeArchitecture/noun-memories-7872495.svg" alt="Memoria Semántica" className="w-8 h-8 object-contain" />) },
                { name: 'Memoria Estructural', tech: 'PostgreSQL + Neo4j', table: 'requirements + grafo', function: 'Dependencias y relaciones', icon: (<img src="/iconHomeArchitecture/noun-memory-8220321.svg" alt="Memoria Estructural" className="w-8 h-8 object-contain" />) },
                { name: 'Memoria Episódica', tech: 'PostgreSQL', table: 'requirement_events', function: 'Historial completo de cambios', icon: (<img src="/iconHomeArchitecture/noun-memory-8158325.svg" alt="Memoria Episódica" className="w-8 h-8 object-contain" />) }
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

        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Comienza a transformar tu proceso de análisis hoy</h2>
            <p className="text-xl text-[var(--color-text-secondary)] mb-8 leading-relaxed">Únete a equipos de desarrollo que ya están ahorrando tiempo y mejorando la calidad de sus especificaciones con SpecAtlas</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary"><Link to="/register">Crear cuenta gratuita</Link></Button>
              <Button variant="secondary"><Link to="/login">Iniciar sesión</Link></Button>
            </div>
            <p className="mt-8 text-sm text-[var(--color-text-muted)]">Sin tarjeta de crédito • 14 días de prueba gratis • Cumple normas ISO 25010</p>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}
