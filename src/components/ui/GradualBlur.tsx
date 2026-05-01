import { useMemo } from 'react'
import * as math from 'mathjs'
import './GradualBlur.css'

export interface GradualBlurProps {
  target?: 'parent' | 'page'
  position?: 'top' | 'bottom' | 'left' | 'right'
  height?: string
  strength?: number
  divCount?: number
  curve?: 'linear' | 'bezier' | 'exponential'
  exponential?: boolean
  opacity?: number
  className?: string
  preset?: 'subtle' | 'footer' | 'default'
  color?: string
}

export default function GradualBlur({
  target = 'parent',
  position = 'bottom',
  height = '8rem',
  strength = 3,
  divCount = 8,
  curve = 'exponential',
  exponential = true,
  opacity = 0.6,
  className = '',
  preset = 'default',
  color = 'var(--color-bg)',
}: GradualBlurProps) {
  const p = useMemo(() => {
    let _strength = strength
    let _opacity = opacity
    let _height = height
    let _curve = curve

    if (preset === 'subtle') {
      _strength = 1.5
      _opacity = 0.5
      _height = '4rem'
      _curve = 'bezier'
    } else if (preset === 'footer') {
      _strength = 5
      _opacity = 0.75
      _height = '6rem'
      _curve = 'exponential'
    }

    return { strength: _strength, opacity: _opacity, height: _height, curve: _curve }
  }, [preset, strength, opacity, height, curve])

  const blurSteps = useMemo(() => {
    const steps = []
    const stepSize = 100 / divCount
    const overlap = stepSize * 0.5 // overlap to prevent seams

    for (let i = 0; i < divCount; i++) {
      const stepProgress = i / (divCount - 1 || 1)

      let factor = stepProgress

      if (p.curve === 'exponential' || exponential) {
        // Evaluate exponential curve using mathjs
        factor = Number(math.evaluate('x^2', { x: stepProgress }))
      } else if (p.curve === 'bezier') {
        // Simplified cubic bezier curve evaluation using mathjs: ease-in-out
        // P0=0, P1=0, P2=1, P3=1
        // B(t) = 3(1-t)*t^2 + t^3
        const formula = '3 * (1 - x) * x^2 + x^3'
        factor = Number(math.evaluate(formula, { x: stepProgress }))
      }

      const blurRadius = factor * p.strength * 10
      const saturateVal = 100 + factor * 80 // Va de 100% a 180% (efecto cristal)

      const start = Math.max(0, i * stepSize - overlap)
      const mid1 = i * stepSize
      const mid2 = (i + 1) * stepSize
      const end = Math.min(100, (i + 1) * stepSize + overlap)

      steps.push({
        blurRadius,
        saturateVal,
        start,
        mid1,
        mid2,
        end,
      })
    }
    return steps
  }, [divCount, p.curve, exponential, p.strength])

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: target === 'page' ? 'fixed' : 'absolute',
      pointerEvents: 'none',
      zIndex: 10,
    }

    switch (position) {
      case 'top':
        return { ...base, top: 0, left: 0, right: 0, height: p.height }
      case 'bottom':
        return { ...base, bottom: 0, left: 0, right: 0, height: p.height }
      case 'left':
        return { ...base, top: 0, bottom: 0, left: 0, width: p.height }
      case 'right':
        return { ...base, top: 0, bottom: 0, right: 0, width: p.height }
      default:
        return { ...base, bottom: 0, left: 0, right: 0, height: p.height }
    }
  }

  const getGradientDirection = () => {
    switch (position) {
      case 'top':
        return 'to bottom'
      case 'bottom':
        return 'to top'
      case 'left':
        return 'to right'
      case 'right':
        return 'to left'
      default:
        return 'to top'
    }
  }

  const direction = getGradientDirection()

  return (
    <div className={`gradual-blur-wrapper ${className}`} style={getPositionStyles()}>
      {blurSteps.map((step, i) => {
        const maskImage = `linear-gradient(${direction}, 
          transparent ${step.start}%, 
          var(--color-bg, #2B2B2B) ${step.mid1}%, 
          var(--color-bg, #2B2B2B) ${step.mid2}%, 
          transparent ${step.end}%
        )`

        return (
          <div
            key={i}
            className="gradual-blur-layer"
            style={{
              backdropFilter: `blur(${step.blurRadius}px) saturate(${step.saturateVal}%)`,
              WebkitBackdropFilter: `blur(${step.blurRadius}px) saturate(${step.saturateVal}%)`,
              maskImage: maskImage,
              WebkitMaskImage: maskImage,
            }}
          />
        )
      })}

      <div
        className="gradual-blur-bg-overlay"
        style={{
          background: `linear-gradient(${direction}, ${color} 0%, transparent 100%)`,
          opacity: p.opacity,
        }}
      />
    </div>
  )
}
