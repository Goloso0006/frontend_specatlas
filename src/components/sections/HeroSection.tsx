import React from 'react'; React;
import Typewriter from '../ui/Typewriter'
import HeroAIGraph from '../ui/KnowledgeGraph'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'

export default function HeroSection() {
  return (
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
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-accent)] drop-shadow-[0_0_calc(var(--ocd-tweak-home-glow-strength,0.12)*80px)_rgba(114,87,53,0.38)]"
                />
              </span>
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
              SpecAtlas es una plataforma que transforma texto en especificaciones estructuradas,
              detecta duplicados automáticamente y genera diagramas profesionales.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button variant="primary">
                <Link to="/register">Comenzar gratis</Link>
              </Button>
              <Button variant="secondary">
                <Link to="/login">Ver demostración</Link>
              </Button>
            </div>
          </div>
          <HeroAIGraph />
        </div>
      </div>
    </section>
  )
}
