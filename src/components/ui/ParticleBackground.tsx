import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'

interface ParticleBackgroundProps {
  className?: string
}

export function ParticleBackground({ className = '' }: ParticleBackgroundProps) {
  const [isReady, setIsReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    let mounted = true

    initParticlesEngine(async engine => {
      await loadSlim(engine)
    }).then(() => {
      if (mounted) {
        setIsReady(true)
      }
    })

    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768)
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)

    return () => {
      mounted = false
      window.removeEventListener('resize', updateViewport)
    }
  }, [])

  const options = useMemo<ISourceOptions>(() => {
    const particleCount = isMobile ? 26 : 58

    return {
      fullScreen: {
        enable: false,
        zIndex: 0,
      },
      background: {
        color: {
          value: '#0a0a0a',
        },
      },
      fpsLimit: 10000,
      detectRetina: true,
      particles: {
        number: {
          value: particleCount,
          density: {
            enable: true,
            width: 1200,
            height: 1200,
          },
        },
        color: {
          value: ['#4ade80', '#60a5fa'],
        },
        links: {
          enable: true,
          distance: isMobile ? 110 : 145,
          color: '#60a5fa',
          opacity: 0.40,
          width: 1,
          triangles: {
            enable: false,
          },
        },
        collisions: {
          enable: false,
        },
        move: {
          enable: true,
          speed: isMobile ? 0.35 : 0.55,
          direction: 'none',
          random: false,
          straight: false,
          outModes: {
            default: 'bounce',
          },
        },
        opacity: {
          value: { min: 0.18, max: 0.68 },
          animation: {
            enable: true,
            speed: 1.1,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 2.6 },
        },
        shadow: {
          enable: true,
          blur: 6,
          color: '#60a5fa',
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'grab',
          },
          resize: {
            enable: true,
            delay: 0.25,
          },
        },
        modes: {
          grab: {
            distance: isMobile ? 120 : 165,
            links: {
              opacity: 0.55,
            },
          },
        },
      },
      emitters: [],
    }
  }, [isMobile])

  if (!isReady) {
    return null
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.10),transparent_30%),linear-gradient(180deg,#121212_0%,#0a0a0a_100%)]" />
      <Particles
        id="particle-background"
        options={options}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
    </div>
  )
}

export default ParticleBackground
