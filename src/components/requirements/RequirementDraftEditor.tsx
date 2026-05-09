import React, { useState } from 'react'
import type { RequirementDTO, NonFunctionalDetailDTO } from '../../types/requirements'

// ── Shared input style ────────────────────────────────────────────────────

const fieldCls = [
  'w-full px-3 py-2 text-[13px] rounded-lg',
  'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
  'transition-all duration-150',
].join(' ')

const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]'

const NF_CATEGORIES = [
  { value: 'SECURITY', label: 'Seguridad' },
  { value: 'PERFORMANCE', label: 'Rendimiento' },
  { value: 'USABILITY', label: 'Usabilidad' },
  { value: 'RELIABILITY', label: 'Confiabilidad' },
  { value: 'MAINTAINABILITY', label: 'Mantenibilidad' },
  { value: 'PORTABILITY', label: 'Portabilidad' },
  { value: 'COMPATIBILITY', label: 'Compatibilidad' },
]

function getCategoryLabel(value: string): string {
  const cat = NF_CATEGORIES.find(c => c.value === value)
  return cat ? cat.label : value || 'No especificada'
}

// ── Types ─────────────────────────────────────────────────────────────────

interface RequirementDraftEditorProps {
  /** Current draft DTO */
  draft: RequirementDTO
  /** Whether fields are in edit mode */
  isEditing: boolean
  /** Toggle between view and edit mode */
  onToggleEdit: () => void
  /** Propagate draft changes to the parent */
  onChange: (updated: RequirementDTO) => void
  /** Optional status text to render in header */
  draftStatus?: 'Completo' | 'Incompleto' | 'Posible RF mal clasificado'
}

// ── Tag list (read-only chips) ─────────────────────────────────────────────

const TagList: React.FC<{ items: string[]; label: string }> = ({ items, label }) => {
  if (!items || items.length === 0) return null
  return (
    <div>
      <p className={`${labelCls} mb-2`}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center h-5 px-2 rounded-md text-[11px] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Criteria list ──────────────────────────────────────────────────────────────
interface CriteriaListProps {
  items: string[]
  isEditing: boolean
  onChange: (items: string[]) => void
}

export const CriteriaList: React.FC<CriteriaListProps> = ({ items, isEditing, onChange }) => {
  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    onChange(newItems)
  }

  const addItem = () => {
    onChange([...items, ''])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  if (!isEditing && items.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={`${labelCls}`}>Criterios de aceptación (BDD)</p>
        {isEditing && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Añadir
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.length === 0 && !isEditing ? (
          <p className="text-[12px] text-[var(--color-text-muted)] italic">Sin criterios definidos</p>
        ) : (
          items.map((criterion, i) => (
            <div key={i} className="group relative flex items-start gap-2.5">
              {isEditing ? (
                <div className="flex-1 flex gap-2">
                  <span className="mt-2.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                  <textarea
                    value={criterion}
                    onChange={(e) => handleItemChange(i, e.target.value)}
                    placeholder="Dado que... cuando... entonces..."
                    rows={1}
                    className={[
                      'flex-1 text-[12.5px] px-2 py-1.5 rounded-lg leading-relaxed',
                      'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
                      'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                      'focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]',
                      'resize-none overflow-hidden h-auto',
                    ].join(' ')}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = target.scrollHeight + 'px'
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto'
                        el.style.height = el.scrollHeight + 'px'
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="mt-1 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    aria-label="Eliminar criterio"
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                  <span className="whitespace-pre-wrap break-words">{criterion}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Non Functional Detail Editor ────────────────────────────────────────────

export const NonFunctionalDetailEditor: React.FC<{
  detail?: NonFunctionalDetailDTO | null,
  isEditing: boolean,
  onChange: (updated: NonFunctionalDetailDTO) => void
}> = ({ detail, isEditing, onChange }) => {
  const data: NonFunctionalDetailDTO = detail || {
    category: '',
    metricName: '',
    operator: '',
    targetValue: '',
    unit: '',
    verificationMethod: '',
    context: '',
    rationale: ''
  }

  function handleChange(field: keyof NonFunctionalDetailDTO, value: string) {
    onChange({ ...data, [field]: value })
  }

  const isIncomplete = !data.category || !data.metricName || !data.operator || !data.targetValue || !data.unit || !data.verificationMethod
  const forceEdit = isEditing || isIncomplete

  if (!forceEdit) {
    return (
      <div className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 space-y-4">
        <p className={`${labelCls} mb-2 border-b border-[var(--color-border)] pb-2`}>Detalle No Funcional</p>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[10px] text-[var(--color-text-muted)]">Categoría</p><p className="text-[12.5px] font-medium">{getCategoryLabel(data.category)}</p></div>
          <div><p className="text-[10px] text-[var(--color-text-muted)]">Métrica</p><p className="text-[12.5px] font-medium">{data.metricName}</p></div>
          <div><p className="text-[10px] text-[var(--color-text-muted)]">Condición</p><p className="text-[12.5px] font-medium">{data.operator} {data.targetValue} {data.unit}</p></div>
          <div><p className="text-[10px] text-[var(--color-text-muted)]">Verificación</p><p className="text-[12.5px] font-medium">{data.verificationMethod}</p></div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 space-y-4">
      <p className={`${labelCls} mb-2 border-b border-[var(--color-border)] pb-2`}>Detalle No Funcional</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className={`${labelCls} mb-1.5`}>Categoría <span className="text-rose-500">*</span></p>
          <select 
            value={data.category} 
            onChange={e => handleChange('category', e.target.value)} 
            className={`${fieldCls} h-8`}
          >
            <option value="">Selecciona categoría...</option>
            {NF_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div>
          <p className={`${labelCls} mb-1.5`}>Métrica <span className="text-rose-500">*</span></p>
          <input type="text" value={data.metricName} onChange={e => handleChange('metricName', e.target.value)} className={`${fieldCls} h-8`} placeholder="ej. Tiempo de respuesta" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className={`${labelCls} mb-1.5`}>Operador <span className="text-rose-500">*</span></p>
          <input type="text" value={data.operator} onChange={e => handleChange('operator', e.target.value)} className={`${fieldCls} h-8`} placeholder="ej. <=" />
        </div>
        <div>
          <p className={`${labelCls} mb-1.5`}>Valor Objetivo <span className="text-rose-500">*</span></p>
          <input type="text" value={data.targetValue} onChange={e => handleChange('targetValue', e.target.value)} className={`${fieldCls} h-8`} placeholder="ej. 200" />
        </div>
        <div>
          <p className={`${labelCls} mb-1.5`}>Unidad <span className="text-rose-500">*</span></p>
          <input type="text" value={data.unit} onChange={e => handleChange('unit', e.target.value)} className={`${fieldCls} h-8`} placeholder="ej. ms" />
        </div>
      </div>

      <div>
        <p className={`${labelCls} mb-1.5`}>Método de verificación <span className="text-rose-500">*</span></p>
        <input type="text" value={data.verificationMethod} onChange={e => handleChange('verificationMethod', e.target.value)} className={`${fieldCls} h-8`} placeholder="ej. Prueba de carga" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className={`${labelCls} mb-1.5`}>Contexto (Opcional)</p>
          <textarea value={data.context || ''} onChange={e => handleChange('context', e.target.value)} className={`${fieldCls} h-16 resize-none`} placeholder="Condiciones bajo las cuales aplica..." />
        </div>
        <div>
          <p className={`${labelCls} mb-1.5`}>Justificación (Opcional)</p>
          <textarea value={data.rationale || ''} onChange={e => handleChange('rationale', e.target.value)} className={`${fieldCls} h-16 resize-none`} placeholder="Razón del requisito..." />
        </div>
      </div>
    </div>
  )
}


// ── Main component ─────────────────────────────────────────────────────────

/**
 * Displays a RequirementDTO as a review card.
 * In view mode: shows all fields read-only.
 * In edit mode: title and description become editable inputs;
 *               other fields remain as read-only preview.
 */
export const RequirementDraftEditor: React.FC<RequirementDraftEditorProps> = ({
  draft,
  isEditing,
  onToggleEdit,
  onChange,
  draftStatus,
}) => {
  const [actorsInput, setActorsInput] = useState('')

  function handleFieldChange(field: keyof RequirementDTO, value: string) {
    onChange({ ...draft, [field]: value })
  }

  function handleNfDetailChange(updated: NonFunctionalDetailDTO) {
    onChange({ ...draft, nonFunctionalDetail: updated })
  }

  return (
    <div
      className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] overflow-hidden"
      style={{ animation: 'slideUp 280ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            {isEditing ? 'Editando borrador' : 'Requisito propuesto'}
          </span>
          {draft.requirementType && (
            <span className="ml-2 inline-flex items-center h-5 px-1.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--color-bg)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)]">
              {draft.requirementType === 'NON_FUNCTIONAL' ? 'No Funcional' : 'Funcional'}
            </span>
          )}
          {draftStatus && (
            <span className={`ml-2 inline-flex items-center h-5 px-2 rounded-md text-[10px] font-semibold tracking-wide ${
              draftStatus === 'Completo' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              draftStatus === 'Posible RF mal clasificado' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
              'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {draftStatus}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {draft.code && (
            <span className="inline-flex items-center h-5 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)] text-[var(--color-accent-foreground)]">
              {draft.code}
            </span>
          )}
          {/* Edit / preview toggle */}
          <button
            type="button"
            onClick={onToggleEdit}
            title={isEditing ? 'Ver vista previa' : 'Editar campos'}
            className={[
              'inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-medium',
              'border border-[var(--color-border-strong)]',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'hover:bg-[var(--color-bg)] transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              isEditing ? 'bg-[var(--color-surface)]' : '',
            ].join(' ')}
          >
            {isEditing ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Vista previa
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="p-5 space-y-5">

        {/* Title */}
        <div>
          <p className={`${labelCls} mb-1.5`}>
            Título <span className="text-rose-500 ml-0.5">*</span>
          </p>
          {isEditing ? (
            <input
              type="text"
              value={draft.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Título del requisito…"
              className={`${fieldCls} h-9`}
            />
          ) : (
            <p className="text-[15px] font-semibold text-[var(--color-text-primary)] leading-snug">
              {draft.title || <span className="text-[var(--color-text-muted)] italic">Sin título</span>}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <p className={`${labelCls} mb-1.5`}>
            Descripción <span className="text-rose-500 ml-0.5">*</span>
          </p>
          {isEditing ? (
            <textarea
              value={draft.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Descripción detallada del requisito…"
              rows={4}
              className={`${fieldCls} resize-none`}
            />
          ) : (
            draft.description
              ? <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{draft.description}</p>
              : <p className="text-[13px] text-[var(--color-text-muted)] italic">Sin descripción</p>
          )}
        </div>

        {/* RNF Detail */}
        {draft.requirementType === 'NON_FUNCTIONAL' && (
          <NonFunctionalDetailEditor 
            detail={draft.nonFunctionalDetail} 
            isEditing={isEditing} 
            onChange={handleNfDetailChange} 
          />
        )}

        {/* Actors + ISO — two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Actors */}
          <div>
            <p className={`${labelCls} mb-2`}>Actores</p>
            {isEditing ? (
              <div className="space-y-2">
                {/* Current actors as removable chips */}
                {draft.actors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.actors.map((actor) => (
                      <span
                        key={actor}
                        className="inline-flex items-center gap-1 h-5 pl-2 pr-1 rounded-md text-[11px] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                      >
                        {actor}
                        <button
                          type="button"
                          onClick={() => onChange({ ...draft, actors: draft.actors.filter((a) => a !== actor) })}
                          className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
                          aria-label={`Eliminar actor ${actor}`}
                        >
                          <svg width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Add actor input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={actorsInput}
                    onChange={(e) => setActorsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && actorsInput.trim()) {
                        e.preventDefault()
                        const newActor = actorsInput.trim()
                        if (!draft.actors.includes(newActor)) {
                          onChange({ ...draft, actors: [...draft.actors, newActor] })
                        }
                        setActorsInput('')
                      }
                    }}
                    placeholder="Actor + Enter para añadir"
                    className={`${fieldCls} h-8 flex-1`}
                  />
                </div>
              </div>
            ) : (
              <TagList items={draft.actors} label="" />
            )}
          </div>

          {/* ISO Classification */}
          <div>
            <p className={`${labelCls} mb-1.5`}>Clasificación ISO 25010</p>
            {isEditing ? (
              <input
                type="text"
                value={draft.isoClassification}
                onChange={(e) => handleFieldChange('isoClassification', e.target.value)}
                placeholder="ej. Funcionalidad, Rendimiento…"
                className={`${fieldCls} h-9`}
              />
            ) : (
              draft.isoClassification
                ? <span className="inline-flex items-center h-5 px-2 rounded-md text-[11px] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">{draft.isoClassification}</span>
                : <p className="text-[12px] text-[var(--color-text-muted)] italic">No especificado</p>
            )}
          </div>
        </div>

        {/* Acceptance criteria */}
        <CriteriaList 
          items={draft.acceptanceCriteria} 
          isEditing={isEditing} 
          onChange={(updated) => onChange({ ...draft, acceptanceCriteria: updated })}
        />

        {/* Related codes */}
        <TagList items={draft.relatedCodes} label="Requisitos relacionados" />
      </div>
    </div>
  )
}
