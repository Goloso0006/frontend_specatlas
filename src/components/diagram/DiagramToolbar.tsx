import { useState } from 'react'
import type { DiagramType, DiagramUmlType } from '../../types/diagrams'

export interface DiagramToolbarProps {
  /** Whether the diagram has been persisted (has a valid diagramId). */
  isSaved: boolean
  /** Whether the diagram source passes validation. */
  isValid: boolean
  /** Whether an element (node or edge) is currently selected. */
  hasSelection: boolean
  /** Current editor status used to disable actions while busy. */
  status: string
  /** The type of diagram being edited. */
  diagramType: DiagramType

  onAddElement: (umlType: DiagramUmlType) => void
  onAddActor: () => void
  onAddUseCase: () => void
  onAddPackage: () => void
  onAutoLayout?: () => void
}

export function DiagramToolbar({
  diagramType,
  onAddElement,
  onAddActor,
  onAddUseCase,
  onAddPackage,
  onAutoLayout,
}: DiagramToolbarProps) {
  const isClass = diagramType === 'CLASS'
  const isUseCase = diagramType === 'USE_CASE'
  
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)

  const classElements = [
    { type: 'CLASS' as DiagramUmlType, label: 'Clase', icon: 'C' },
    { type: 'ABSTRACT_CLASS' as DiagramUmlType, label: 'Clase Abstracta', icon: 'A' },
    { type: 'INTERFACE' as DiagramUmlType, label: 'Interfaz', icon: 'I' },
    { type: 'ENUM' as DiagramUmlType, label: 'Enumeración', icon: 'E' },
  ]

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full relative">
      
      {/* ── Add Elements Group ── */}
      <div className="relative group">
        <button
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 shadow-md ${
            isAddMenuOpen 
              ? 'bg-[var(--color-accent)] text-white scale-105' 
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
          }`}
          title="Agregar elemento"
        >
          {isAddMenuOpen ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12M6 12h12" />
            </svg>
          )}
        </button>

        {/* Dropdown Menu: cards with icon + label */}
        {isAddMenuOpen && (
          <div className="absolute left-14 top-0 w-60 bg-[var(--color-bg-card)] dark:bg-[#0b0f12] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden py-3 z-50 animate-in fade-in duration-200">
            <div className="px-3">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Crear elemento</div>
              <div className="grid grid-cols-1 gap-2">
                {isClass && classElements.map(item => (
                  <button key={item.type} className="w-full p-2 flex items-center gap-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors" onClick={() => { onAddElement(item.type); setIsAddMenuOpen(false) }}>
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{item.icon}</span>
                    </div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</div>
                  </button>
                ))}
                {isUseCase && (
                  <>
                    <button className="w-full p-2 flex items-center gap-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors" onClick={() => { onAddActor(); setIsAddMenuOpen(false) }}>
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">Actor</div>
                    </button>
                    <button className="w-full p-2 flex items-center gap-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors" onClick={() => { onAddUseCase(); setIsAddMenuOpen(false) }}>
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                        <div className="w-6 h-3 rounded-full border-2 border-emerald-600" />
                      </div>
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">Caso de Uso</div>
                    </button>
                  </>
                )}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 p-2 flex items-center gap-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                    onClick={() => {
                      onAddPackage()
                      setIsAddMenuOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">Paquete / Grupo</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-2" />

      {onAutoLayout && (
        <button
          onClick={onAutoLayout}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] hover:text-indigo-500 transition-all duration-300 shadow-md border border-[var(--color-border)]"
          title="Reorganizar diagrama automáticamente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      )}


    </div>
  )
}
