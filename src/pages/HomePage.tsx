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

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "homeAccentColor": "#725735",
  "homeAccentHover": "#5C452B",
  "homeAccentSubtle": "#EFE6D4",
  "homeGlowStrength": 0.12
}/*EDITMODE-END*/;
void TWEAK_DEFAULTS;

const riskCards = [
  { label: 'Requisitos ambiguos', value: 'retraba­jo', text: 'Historias sin criterios medibles terminan en cambios tardíos y decisiones dispersas.' },
  { label: 'Trazabilidad rota', value: 'impacto invisible', text: 'Cuando cambia una regla, el equipo no ve qué pantallas, datos o diagramas quedan afectados.' },
  { label: 'Conocimiento perdido', value: 'memoria frágil', text: 'Las decisiones de análisis viven en chats, documentos sueltos y revisiones difíciles de auditar.' }
]

const solutionBullets = [
  'Convierte texto libre en requisitos estructurados en menos de 10 segundos',
  'Detecta ambigüedades automáticamente con criterios IEEE 830 / ISO 25010',
  'Encuentra requisitos similares mediante búsqueda semántica con pgvector',
  'Calcula impacto con grafos de dependencias en Neo4j',
  'Genera diagramas UML asistidos por IA sin perder trazabilidad'
]

const techStack = [
  { name: 'PostgreSQL 16', description: 'Base relacional principal', details: 'Usuarios, proyectos, requisitos, eventos y reglas de validación con consistencia transaccional.', icon: (<img src="/iconHomeTechStack/noun-postgresql-3451760.svg" alt="PostgreSQL" className="h-14 w-14 object-contain" />) },
  { name: 'pgvector', description: 'Búsqueda semántica', details: 'Embeddings de 768 dimensiones para similitud, duplicados y recuperación contextual.', icon: (<img src="/iconHomeTechStack/noun-vector-8224612.svg" alt="pgvector" className="h-14 w-14 object-contain" />) },
  { name: 'Neo4j', description: 'Relaciones e impacto', details: 'Dependencias entre requisitos para visualizar cambios antes de romper flujos críticos.', icon: (<img src="/iconHomeTechStack/noun-spiderweb-8078963.svg" alt="Neo4j" className="h-14 w-14 object-contain" />) },
  { name: 'Google Gemini', description: 'Motor de análisis IA', details: 'Transforma texto, detecta ambigüedades y genera modelos con contexto del proyecto.', icon: (<img src="/iconHomeTechStack/noun-artificial-8234436.svg" alt="Google Gemini" className="h-13 w-13 object-contain" />) },
  { name: 'Spring Boot 3', description: 'Backend Java 21', details: 'API REST con seguridad, JWT y servicios separados por dominio funcional.', icon: (<img src="/iconHomeTechStack/noun-power-button-8306535.svg" alt="Spring Boot 3" className="h-13 w-13 object-contain" />) },
  { name: 'React + TypeScript', description: 'Frontend de trabajo', details: 'Interfaz rápida para revisar, editar, trazar y modelar especificaciones de software.', icon: (<img src="/iconHomeTechStack/noun-atom-8190848.svg" alt="React + TypeScript" className="h-13 w-13 object-contain" />) }
]

const memories = [
  { name: 'Memoria Procedimental', tech: 'PostgreSQL', table: 'validation_rules', function: 'Reglas de validación IEEE 830 / ISO 25010', icon: (<img src="/iconHomeArchitecture/noun-memory-8182813.svg" alt="Memoria Procedimental" className="h-8 w-8 object-contain" />) },
  { name: 'Memoria Semántica', tech: 'pgvector + Gemini', table: 'requirements.embedding', function: 'Búsqueda por similitud semántica', icon: (<img src="/iconHomeArchitecture/noun-memories-7872495.svg" alt="Memoria Semántica" className="h-8 w-8 object-contain" />) },
  { name: 'Memoria Estructural', tech: 'PostgreSQL + Neo4j', table: 'requirements + grafo', function: 'Dependencias y relaciones', icon: (<img src="/iconHomeArchitecture/noun-memory-8220321.svg" alt="Memoria Estructural" className="h-8 w-8 object-contain" />) },
  { name: 'Memoria Episódica', tech: 'PostgreSQL', table: 'requirement_events', function: 'Historial completo de cambios', icon: (<img src="/iconHomeArchitecture/noun-memory-8158325.svg" alt="Memoria Episódica" className="h-8 w-8 object-contain" />) }
]

export default function HomePage() {
  const { show, hide } = usePreloader()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased">
      <DustParticles />
      <TopNav />
      <PreloaderOverlay show={show} hide={hide} />

      <div className="relative z-10">
        <HeroSection />

        <section id="problem" className="px-6 py-24 bg-[var(--color-bg-secondary)]">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-3 text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Antes de modelar</p>
              <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">El riesgo nace en el análisis, no en el código</h2>
              <p className="text-xl text-[var(--color-text-secondary)]">SpecAtlas ordena la etapa donde los requisitos se vuelven decisiones verificables.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {riskCards.map((risk) => (
                <article key={risk.label} className="group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_18px_45px_rgba(43,43,43,0.09)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-border),var(--color-accent),var(--color-border))] opacity-70" />
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{risk.label}</p>
                  <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">{risk.value}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{risk.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="solution" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="mb-3 text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Flujo de calidad</p>
                <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">De frase ambigua a especificación auditable</h2>
                <p className="mb-8 text-lg leading-relaxed text-[var(--color-text-secondary)]">SpecAtlas no solo almacena requisitos: los analiza, los estructura y mantiene memoria del razonamiento técnico detrás de cada decisión.</p>
                <div className="space-y-4">
                  {solutionBullets.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 shadow-[0_24px_70px_rgba(43,43,43,0.10)]">
                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <div className="rounded-2xl bg-[var(--color-bg-card)] p-4">
                    <div className="mb-2 text-xs font-mono text-[var(--color-text-muted)]"><img src="/iconsHomeSectionSolution/noun-text-5035477.svg" alt="Texto original" className="mr-2 inline-block h-4 w-4 align-text-bottom" />Texto original</div>
                    <div className="text-sm italic text-[var(--color-text-secondary)]">“El sistema debe ser rápido y fácil de usar”</div>
                  </div>
                  <div className="mx-auto my-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">↓</div>
                  <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-accent-subtle)] p-5">
                    <div className="mb-3 text-xs font-mono font-semibold text-[var(--color-accent)]"><img src="/iconsHomeSectionSolution/noun-item-7552539.svg" alt="Requisito estructurado" className="mr-2 inline-block h-4 w-4 align-text-bottom" />Requisito estructurado</div>
                    <div className="space-y-2 text-sm text-[var(--color-text-primary)]">
                      <div><span className="font-semibold">Título:</span> Tiempo de respuesta del sistema</div>
                      <div><span className="font-semibold">BDD:</span> Dado que el usuario realiza una acción, cuando el sistema procesa la solicitud, entonces la respuesta debe ser menor a 2 segundos.</div>
                      <div className="mt-3 rounded-xl bg-[var(--color-bg-card)] p-3 text-xs text-[var(--color-text-muted)]"><img src="/iconsHomeSectionSolution/noun-warning-6740277.svg" alt="Advertencia" className="mr-2 inline-block h-4 w-4 align-text-bottom" />Ambigüedad detectada: “fácil” no tiene métrica definida.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-24 bg-[linear-gradient(180deg,var(--color-bg),var(--color-bg-secondary))]">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-3 text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Módulos principales</p>
              <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Tres superficies para trabajar requisitos con contexto</h2>
              <p className="text-xl text-[var(--color-text-secondary)]">Tarjetas más claras, con jerarquía editorial y detalles accionables al explorar cada módulo.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <FlipCard icon={(<img src="/iconsHomeFlipCard/noun-dependencies-8099254.svg" alt="Gestión de Requisitos" className="h-12 w-12" />)} title="Gestión de Requisitos" description="Convierte texto libre, valida calidad y exporta especificaciones listas para revisión." backContent={(<div className="w-full space-y-3 px-2 text-left"><h4 className="text-center text-lg font-semibold text-[var(--color-text-primary)]">Gestión de Requisitos</h4><ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]"><li>✓ Conversión texto → requisito</li><li>✓ Validación automática</li><li>✓ Detección de ambigüedades</li><li>✓ Exportación PDF/Excel</li><li>✓ Historial de decisiones</li></ul></div>)} />
              <FlipCard icon={(<img src="/iconsHomeFlipCard/noun-analysis-5915854.svg" alt="Análisis y Calidad" className="h-12 w-12" />)} title="Análisis y Calidad" description="Encuentra duplicados, dependencias y riesgos antes de que lleguen a desarrollo." backContent={(<div className="w-full space-y-3 px-2 text-left"><h4 className="text-center text-lg font-semibold text-[var(--color-text-primary)]">Análisis y Calidad</h4><ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]"><li>✓ Búsqueda semántica</li><li>✓ Detección de duplicados</li><li>✓ Análisis de impacto</li><li>✓ Grafo de dependencias</li><li>✓ Memoria episódica</li></ul></div>)} />
              <FlipCard icon={(<img src="/iconsHomeFlipCard/noun-uml-8322951.svg" alt="Modelado UML" className="h-12 w-12" />)} title="Modelado UML" description="Genera diagramas conectados a requisitos y mantén modelos alineados al alcance." backContent={(<div className="w-full space-y-3 px-2 text-left"><h4 className="text-center text-lg font-semibold text-[var(--color-text-primary)]">Modelado UML</h4><ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]"><li>✓ Casos de uso</li><li>✓ Diagrama de clases</li><li>✓ Secuencias</li><li>✓ Componentes</li><li>✓ Generación con IA</li></ul></div>)} />
            </div>
          </div>
        </section>

        <section id="tech" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-3 text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Stack operativo</p>
              <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Tecnología organizada por responsabilidad</h2>
              <p className="text-xl text-[var(--color-text-secondary)]">Una arquitectura de almacenamiento, IA y modelado donde cada pieza tiene una función clara.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {techStack.map((tech) => (
                <article key={tech.name} className="group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_18px_45px_rgba(43,43,43,0.09)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-border),var(--color-accent-subtle),var(--color-border))]" />
                  <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] opacity-90 transition-transform group-hover:scale-105">{tech.icon}</div>
                  <h3 className="mb-1 text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{tech.name}</h3>
                  <p className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">{tech.description}</p>
                  <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{tech.details}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 bg-[var(--color-bg-secondary)]">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-3 text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Memoria del sistema</p>
              <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Arquitectura de las 4 Memorias</h2>
              <p className="text-xl text-[var(--color-text-secondary)]">Modelo cognitivo para que los requisitos no sean documentos aislados, sino conocimiento recuperable.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {memories.map((memory) => (
                <article key={memory.name} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_18px_45px_rgba(43,43,43,0.08)]">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-surface)]">{memory.icon}</div>
                  <h3 className="mb-3 text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{memory.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="font-mono text-xs font-semibold text-[var(--color-accent)]">{memory.tech}</div>
                    <div className="rounded-md bg-[var(--color-surface)] px-2 py-1 font-mono text-xs text-[var(--color-text-muted)]">{memory.table}</div>
                    <div className="text-xs leading-5 text-[var(--color-text-secondary)]">{memory.function}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center shadow-[0_24px_70px_rgba(43,43,43,0.08)] md:p-12">
            <p className="mb-3 text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Siguiente paso</p>
            <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">Transforma análisis disperso en especificaciones confiables</h2>
            <p className="mb-8 text-xl leading-relaxed text-[var(--color-text-secondary)]">Empieza con un proyecto, convierte requisitos reales y conserva la trazabilidad desde el primer cambio.</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
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
