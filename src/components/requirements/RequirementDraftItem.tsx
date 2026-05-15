import { RequirementDraftEditor } from './RequirementDraftEditor'
import { DuplicateWarningPanel } from './DuplicateWarningPanel'
import type { RequirementDTO } from '../../types/requirements'
import type { RequirementDraft, RequirementType } from '../../hooks/useRequirementAI'

interface RequirementDraftItemProps {
  item: RequirementDraft
  requirementType: RequirementType
  onUpdateDraft: (draftId: string, updates: Partial<RequirementDraft>) => void
  onChangeRequirement: (draftId: string, req: RequirementDTO) => void
  onRecheckDuplicates: (draftId: string, req: RequirementDTO) => void
}

export function RequirementDraftItem({
  item,
  requirementType,
  onUpdateDraft,
  onChangeRequirement,
  onRecheckDuplicates,
}: RequirementDraftItemProps) {
  const isCrossMatchOnly =
    item.duplicateState.status === 'found' &&
    item.duplicateState.duplicates.every(
      (dup) => requirementType === 'NON_FUNCTIONAL' && dup.requirementType === 'FUNCTIONAL'
    )
  const unconfirmedDup =
    !item.duplicateConfirmed &&
    !isCrossMatchOnly &&
    (item.duplicateState.status === 'found' || item.duplicateState.status === 'error')
  const hasErrors = item.validationErrors.length > 0
  const hasWarnings = item.validationWarnings.length > 0
  const unconfirmedWarn = hasWarnings && !item.classificationWarningConfirmed

  let status: 'Completo' | 'Incompleto' | 'Posible RF mal clasificado' = 'Completo'
  if (hasErrors) status = 'Incompleto'
  else if (hasWarnings) status = 'Posible RF mal clasificado'

  return (
    <div className={`flex gap-3 transition-opacity ${!item.selected ? 'opacity-50' : ''}`}>
      {/* Selection Checkbox Container */}
      <div className="pt-4 flex-shrink-0 flex flex-col gap-3 items-center">
        <label className="flex items-center justify-center w-6 h-6 cursor-pointer">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={(e) => onUpdateDraft(item.draftId, { selected: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-bg)] cursor-pointer"
          />
        </label>
        <button
          type="button"
          onClick={() => onUpdateDraft(item.draftId, { discarded: true })}
          title="Descartar propuesta"
          className="text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Draft Content */}
      <div className="flex-1 min-w-0 space-y-3">
        <RequirementDraftEditor
          draft={item.requirement}
          isEditing={item.isEditing}
          onToggleEdit={() => onUpdateDraft(item.draftId, { isEditing: !item.isEditing })}
          onChange={(req) => onChangeRequirement(item.draftId, req)}
          draftStatus={status}
        />

        {/* Backend Error */}
        {item.backendError && (
          <div className="px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-[12.5px] text-rose-600 dark:text-rose-400 font-medium">
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Error al guardar: {item.backendError}
            </p>
          </div>
        )}

        {/* Validation Errors for this draft */}
        {item.selected && hasErrors && (
          <div className="px-4 py-2.5 rounded-xl border border-rose-400/30 bg-rose-50/10 dark:bg-rose-900/10 space-y-1">
            <p className="text-[12px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
              Requiere corrección:
            </p>
            {item.validationErrors.map((err, i) => (
              <p key={i} className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                {err}
              </p>
            ))}
          </div>
        )}

        {/* Validation Warnings for this draft */}
        {item.selected && unconfirmedWarn && !hasErrors && (
          <div className="px-4 py-3 rounded-xl border border-amber-400/30 bg-amber-50/10 dark:bg-amber-900/10 space-y-3">
            <div>
              <p className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Advertencia de clasificación:
              </p>
              {item.validationWarnings.map((warn, i) => (
                <p
                  key={i}
                  className="text-[12px] text-[var(--color-text-muted)] flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                  {warn}
                </p>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-amber-400/20">
              <button
                type="button"
                onClick={() => onUpdateDraft(item.draftId, { classificationWarningConfirmed: true })}
                className="h-7 px-3 rounded-md text-[11px] font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                Confirmar de todas formas
              </button>
            </div>
          </div>
        )}

        {/* Unconfirmed duplicate blocker warning */}
        {item.selected && unconfirmedDup && !hasErrors && (
          <div className="px-4 py-2.5 rounded-xl border border-amber-400/30 bg-amber-50/10 dark:bg-amber-900/10">
            <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
              Revisa la advertencia de duplicados abajo y confirma antes de guardar.
            </p>
          </div>
        )}

        {/* Duplicate Check Panel */}
        {item.selected &&
          (item.duplicateState.status === 'idle' ? (
            <button
              type="button"
              onClick={() => onRecheckDuplicates(item.draftId, item.requirement)}
              className="w-full h-8 rounded-lg text-[12px] font-medium border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all"
            >
              Verificar duplicados
            </button>
          ) : (
            <DuplicateWarningPanel
              state={item.duplicateState}
              isConfirmed={item.duplicateConfirmed}
              onConfirm={() => onUpdateDraft(item.draftId, { duplicateConfirmed: true })}
              onEdit={() => onUpdateDraft(item.draftId, { isEditing: true })}
              onDiscard={() => onUpdateDraft(item.draftId, { discarded: true })}
              currentDraftType={requirementType}
            />
          ))}
      </div>
    </div>
  )
}
