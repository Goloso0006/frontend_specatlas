import type { DiagramValidationResult, DiagramValidationIssue } from '../../types/diagrams'
import { Button } from '../ui/Button'

interface DiagramValidationModalProps {
  result: DiagramValidationResult
  onClose: () => void
  onConfirm: () => void
  onSelectIssue?: (targetType: 'node' | 'edge' | 'diagram', targetId?: string) => void
}

export function DiagramValidationModal({
  result,
  onClose,
  onConfirm,
  onSelectIssue,
}: DiagramValidationModalProps) {
  const hasErrors = result.errors.length > 0
  const hasWarnings = result.warnings.length > 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#121212] w-full max-w-2xl rounded-3xl border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`p-6 border-b flex items-center gap-4 ${hasErrors ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${hasErrors ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            {hasErrors ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-text-primary">Revisión del diagrama</h2>
            <p className="text-sm text-app-text-secondary">
              {hasErrors 
                ? 'Se encontraron errores que deben corregirse antes de guardar.' 
                : 'El diagrama puede guardarse, pero se encontraron recomendaciones.'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Errors Section */}
          {hasErrors && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                Errores Críticos ({result.errors.length})
              </h3>
              <div className="space-y-2">
                {result.errors.map((issue) => (
                  <ValidationIssueCard 
                    key={issue.id} 
                    issue={issue} 
                    onClick={() => onSelectIssue?.(issue.targetType, issue.targetId)} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Warnings Section */}
          {hasWarnings && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Sugerencias y Advertencias ({result.warnings.length})
              </h3>
              <div className="space-y-2">
                {result.warnings.map((issue) => (
                  <ValidationIssueCard 
                    key={issue.id} 
                    issue={issue} 
                    onClick={() => onSelectIssue?.(issue.targetType, issue.targetId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50/50 dark:bg-white/5 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {hasErrors ? 'Entendido' : 'Volver a corregir'}
          </Button>
          {!hasErrors && (
            <Button variant="primary" onClick={onConfirm}>
              Guardar de todas formas
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ValidationIssueCard({ 
  issue, 
  onClick 
}: { 
  issue: DiagramValidationIssue, 
  onClick: () => void 
}) {
  const isError = issue.severity === 'error'
  const isSelectable = issue.targetType !== 'diagram'

  return (
    <div 
      onClick={isSelectable ? onClick : undefined}
      className={`flex gap-3 p-3 rounded-2xl border transition-all ${isSelectable ? 'cursor-pointer hover:scale-[1.01] active:scale-100 shadow-sm hover:shadow-md' : ''} ${
      isError 
        ? 'bg-rose-50/30 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/20' 
        : 'bg-amber-50/30 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/20'
    }`}>
      <div className={`mt-0.5 shrink-0 ${isError ? 'text-rose-500' : 'text-amber-500'}`}>
        {isError ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-app-text-primary leading-tight">
          {issue.message}
        </p>
        {issue.targetId && (
          <p className="text-[10px] font-mono text-app-text-muted uppercase tracking-tighter">
            ID: {issue.targetId}
          </p>
        )}
      </div>
    </div>
  )
}
