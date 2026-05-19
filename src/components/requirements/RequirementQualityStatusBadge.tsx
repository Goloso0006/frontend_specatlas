import React from 'react'
import type { RequirementQualityAnalysisDTO } from '../../types/requirements'

interface RequirementQualityStatusBadgeProps {
  analysis: RequirementQualityAnalysisDTO | null
  onClick?: () => void
}

export const RequirementQualityStatusBadge: React.FC<RequirementQualityStatusBadgeProps> = ({
  analysis,
  onClick,
}) => {
  // If no analysis is found
  if (!analysis) {
    return (
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onClick?.()
        }}
        className={[
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
          'bg-gray-500/5 border-gray-500/20 text-gray-400',
          'text-[11px] font-medium tracking-wide cursor-pointer',
          'transition-all duration-200 hover:bg-gray-500/10 hover:border-gray-500/30',
        ].join(' ')}
        title="Ver detalles de ambigüedad y calidad"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
        Sin análisis
      </button>
    )
  }

  const { qualityStatus, totalViolations } = analysis

  let badgeClasses = ''
  let dotClasses = ''
  let label = ''

  switch (qualityStatus) {
    case 'OK':
      badgeClasses = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30'
      dotClasses = 'bg-emerald-400'
      label = 'Correcto'
      break
    case 'WARNING':
      badgeClasses = 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/30'
      dotClasses = 'bg-amber-400'
      label = totalViolations === 1 ? 'Revisar (1)' : `Revisar (${totalViolations})`
      break
    case 'ERROR':
      badgeClasses = 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/30'
      dotClasses = 'bg-rose-400'
      label = totalViolations === 1 ? 'Error (1)' : `Errores (${totalViolations})`
      break
    case 'FAILED':
      badgeClasses = 'bg-red-900/20 border-red-500/20 text-red-300 hover:bg-red-900/30'
      dotClasses = 'bg-red-500'
      label = 'Error de análisis'
      break
    default:
      badgeClasses = 'bg-gray-500/10 border-gray-500/20 text-gray-400'
      dotClasses = 'bg-gray-400'
      label = 'Sin análisis'
  }

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        onClick?.()
      }}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
        'text-[11px] font-medium tracking-wide cursor-pointer',
        'transition-all duration-200 shadow-sm',
        badgeClasses,
      ].join(' ')}
      title="Ver observaciones de calidad"
    >
      <span className={['w-1.5 h-1.5 rounded-full', dotClasses].join(' ')} />
      {label}
    </button>
  )
}
