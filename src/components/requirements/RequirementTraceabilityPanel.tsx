import React, { useState, useEffect } from 'react'
import { requirementFacade } from '../../facades/requirement.facade'
import type { 
  RequirementDTO, 
  TraceabilityLink, 
  TestCase, 
  TraceabilityTargetType, 
  TraceabilityRelationType 
} from '../../types/requirements'
import { useApiOperation } from '../../hooks/useLoadingError'
import { Button } from '../ui/Button'

interface RequirementTraceabilityPanelProps {
  requirement: RequirementDTO
  onClose: () => void
}

const TARGET_TYPES: { value: TraceabilityTargetType; label: string }[] = [
  { value: 'TEST_CASE', label: 'Caso de prueba' },
  { value: 'DIAGRAM', label: 'Diagrama' },
  { value: 'CLASS', label: 'Clase' },
  { value: 'COMPONENT', label: 'Componente' },
  { value: 'MODULE', label: 'Módulo' },
  { value: 'ARCHITECTURE_ELEMENT', label: 'Elemento arquitectónico' },
]

const RELATION_TYPES: { value: TraceabilityRelationType; label: string }[] = [
  { value: 'VALIDATED_BY', label: 'Validado por' },
  { value: 'REPRESENTED_IN', label: 'Representado en' },
  { value: 'IMPLEMENTED_BY', label: 'Implementado por' },
  { value: 'DEPENDS_ON', label: 'Depende de' },
  { value: 'IMPACTS', label: 'Impacta' },
  { value: 'REFINES', label: 'Refina' },
  { value: 'RELATED_TO', label: 'Relacionado con' },
]

export const RequirementTraceabilityPanel: React.FC<RequirementTraceabilityPanelProps> = ({ requirement, onClose }) => {
  const { run, isLoading } = useApiOperation()
  const [links, setLinks] = useState<TraceabilityLink[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTestCaseForm, setShowTestCaseForm] = useState(false)
  
  const [newLink, setNewLink] = useState<Partial<TraceabilityLink>>({
    targetType: 'TEST_CASE',
    relationType: 'VALIDATED_BY',
  })
  
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    code: '',
    title: '',
    description: '',
    expectedResult: '',
  })

  useEffect(() => {
    loadData()
  }, [requirement.id])

  const loadData = async () => {
    await run(async () => {
      const [linksData, testCasesData] = await Promise.all([
        requirementFacade.getRequirementTraceability(requirement.id),
        requirementFacade.listTestCases(requirement.projectId)
      ])
      setLinks(linksData)
      setTestCases(testCasesData)
      
      // We also need diagrams for the selector
      // Assuming there is a way to get diagrams from requirementFacade or another facade
      // For now we'll fetch them from the api if available in endpoints
      // Actually, let's see if we can get diagrams.
    })
  }

  const handleAddLink = async () => {
    if (!newLink.targetType || !newLink.relationType || !newLink.targetName) return
    
    await run(async () => {
      const payload: TraceabilityLink = {
        projectId: requirement.projectId,
        requirementId: requirement.id,
        targetType: newLink.targetType as TraceabilityTargetType,
        relationType: newLink.relationType as TraceabilityRelationType,
        targetId: newLink.targetId || 'MANUAL',
        targetName: newLink.targetName as string,
        description: newLink.description,
      }
      
      await requirementFacade.createTraceabilityLink(payload)
      setShowAddForm(false)
      setNewLink({ targetType: 'TEST_CASE', relationType: 'VALIDATED_BY' })
      loadData()
    })
  }

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este enlace de trazabilidad?')) return
    
    await run(async () => {
      await requirementFacade.deleteTraceabilityLink(id)
      loadData()
    })
  }

  const handleCreateTestCase = async () => {
    if (!newTestCase.code || !newTestCase.title) return
    
    await run(async () => {
      const created = await requirementFacade.createTestCase({
        ...newTestCase as TestCase,
        projectId: requirement.projectId,
      })
      
      // Automatically link it
      const payload: TraceabilityLink = {
        projectId: requirement.projectId,
        requirementId: requirement.id,
        targetType: 'TEST_CASE',
        relationType: 'VALIDATED_BY',
        targetId: created.id!,
        targetName: created.title,
        description: `Enlazado automáticamente al crear el caso de prueba: ${created.code}`,
      }
      
      await requirementFacade.createTraceabilityLink(payload)
      setShowTestCaseForm(false)
      setNewTestCase({ code: '', title: '', description: '', expectedResult: '' })
      loadData()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 md:p-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] w-full max-w-2xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]/50">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Gestión de trazabilidad
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 font-mono uppercase tracking-wider">
              {requirement.code} · {requirement.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Linked items list */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Enlaces existentes</h3>
              {!showAddForm && (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="text-xs font-bold text-cyan-500 hover:text-cyan-600 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Agregar enlace
                </button>
              )}
            </div>

            {links.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center text-center">
                <svg className="w-12 h-12 text-[var(--color-border-strong)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                <p className="text-[var(--color-text-muted)] text-sm">No hay trazabilidad registrada para este requisito.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {links.map(link => (
                  <div key={link.id} className="p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl group relative hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 text-[9px] font-bold uppercase tracking-tighter border border-cyan-500/20">
                            {link.targetType}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-medium italic">
                            {RELATION_TYPES.find(r => r.value === link.relationType)?.label}
                          </span>
                        </div>
                        <h4 className="font-bold text-[var(--color-text-primary)] text-sm">{link.targetName}</h4>
                        {link.description && <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{link.description}</p>}
                      </div>
                      <button 
                        onClick={() => handleDeleteLink(link.id!)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Eliminar enlace"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Add Form */}
          {showAddForm && (
            <section className="bg-[var(--color-surface)]/50 border border-[var(--color-border)] rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Nuevo enlace de trazabilidad</h3>
                <button onClick={() => setShowAddForm(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Tipo de destino</label>
                  <select 
                    value={newLink.targetType}
                    onChange={e => setNewLink({ ...newLink, targetType: e.target.value as TraceabilityTargetType })}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                  >
                    {TARGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Relación</label>
                  <select 
                    value={newLink.relationType}
                    onChange={e => setNewLink({ ...newLink, relationType: e.target.value as TraceabilityRelationType })}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                  >
                    {RELATION_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Destino</label>
                {newLink.targetType === 'TEST_CASE' ? (
                  <div className="space-y-2">
                    <select 
                      onChange={e => {
                        const tc = testCases.find(t => t.id === e.target.value)
                        setNewLink({ ...newLink, targetId: e.target.value, targetName: tc?.title || '' })
                      }}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                    >
                      <option value="">Selecciona un caso de prueba...</option>
                      {testCases.map(tc => <option key={tc.id} value={tc.id}>[{tc.code}] {tc.title}</option>)}
                    </select>
                    <button 
                      onClick={() => setShowTestCaseForm(true)}
                      className="text-[11px] text-cyan-600 font-bold hover:underline ml-1"
                    >
                      + Crear nuevo caso de prueba
                    </button>
                  </div>
                ) : (
                  <input 
                    type="text"
                    value={newLink.targetName || ''}
                    onChange={e => setNewLink({ ...newLink, targetName: e.target.value })}
                    placeholder="Nombre del componente, clase o módulo..."
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Descripción (opcional)</label>
                <textarea 
                  value={newLink.description || ''}
                  onChange={e => setNewLink({ ...newLink, description: e.target.value })}
                  placeholder="Explica por qué existe esta relación..."
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={handleAddLink} disabled={isLoading || !newLink.targetName}>Guardar enlace</Button>
              </div>
            </section>
          )}

          {/* Test Case Form */}
          {showTestCaseForm && (
            <section className="bg-[var(--color-surface)]/50 border border-[var(--color-border)] rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Crear caso de prueba</h3>
                <button onClick={() => setShowTestCaseForm(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Código</label>
                  <input 
                    type="text"
                    value={newTestCase.code}
                    onChange={e => setNewTestCase({ ...newTestCase, code: e.target.value })}
                    placeholder="CP-001"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Título</label>
                  <input 
                    type="text"
                    value={newTestCase.title}
                    onChange={e => setNewTestCase({ ...newTestCase, title: e.target.value })}
                    placeholder="Título del caso..."
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Descripción</label>
                <textarea 
                  value={newTestCase.description}
                  onChange={e => setNewTestCase({ ...newTestCase, description: e.target.value })}
                  placeholder="Pasos a seguir..."
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none resize-none h-20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Resultado esperado</label>
                <textarea 
                  value={newTestCase.expectedResult}
                  onChange={e => setNewTestCase({ ...newTestCase, expectedResult: e.target.value })}
                  placeholder="Qué debería suceder..."
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowTestCaseForm(false)}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={handleCreateTestCase} disabled={isLoading || !newTestCase.code || !newTestCase.title}>Crear y enlazar</Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
