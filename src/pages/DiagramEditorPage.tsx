import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { DiagramCanvas } from '../components/diagram/DiagramCanvas'
import { DiagramSidebar } from '../components/diagram/DiagramSidebar'
import { DiagramToolbar } from '../components/diagram/DiagramToolbar'
import { DiagramValidationModal } from '../components/diagram/DiagramValidationModal'
import { GeneratedDiagramReviewModal } from '../components/diagram/GeneratedDiagramReviewModal'
import { DiagramErrorBoundary } from '../components/diagram/DiagramErrorBoundary'
import { Button } from '../components/ui/Button'
import { useDiagramEditorController } from '../hooks/useDiagramEditorController'

export function DiagramEditorPage() {
  const controller = useDiagramEditorController()

  const {
    state: editorState,
    isTypeSupported,
    projectId,
    diagramId,
    diagramName,
    diagramType,
    selectedNodeId,
    selectedEdgeId,
    selectedNode,
    selectedEdge,
    editorTarget,
    validationResult,
    showValidationModal,
    aiProposal,
    showAiModal,
    isSidebarOpen,
    saveFeedback,
    currentTipIndex,
    nodes,
    edges,
    validation,
    isGlobalLoading,
    handleNodesChange,
    handleEdgesChange,
    handleSelectionChange,
    handleConnect,
    handleAddElement,
    handleAddActor,
    handleAddUseCase,
    handleAddPackage,
    handleAddPackageWithOptions,
    handleDeleteSelected,
    handleDeleteNode,
    handleDeleteEdge,
    handleNodeDragStop,
    updateNode,
    updateEdge,
    handleSaveDiagram,
    handleGenerateAutoDiagram,
    handleApplyAiReplace,
    handleApplyAiMerge,
    handleCloseAiModal,
    handleSelectIssue,
    setDiagramName,
    setIsSidebarOpen,
    setShowValidationModal,
  } = controller

  /* ── Guards ── */
  if (!projectId) {
    return <NoProjectSelected message="Selecciona un proyecto válido para administrar diagramas." />
  }

  if (!isTypeSupported && !diagramId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--color-bg)">
        <div className="text-center p-8 bg-(--color-bg-card) rounded-2xl border border-(--color-border) max-w-md">
          <div className="w-16 h-16 rounded-full bg-(--color-accent-subtle) text-(--color-accent) flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-(--color-text-primary) mb-2">Tipo de diagrama no soportado</h2>
          <p className="text-(--color-text-secondary) mb-6">Solo se pueden crear diagramas de Clases o de Casos de Uso en esta fase.</p>
          <Button onClick={() => window.history.back()}>Volver a la biblioteca</Button>
        </div>
      </div>
    )
  }

  /* ── Render ── */
  return (
    <DiagramErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-96px)] min-h-0 bg-(--color-bg) overflow-hidden">
        {/* ── Estilos internos ── */}
        <style>{`
          .canvas-bg {
            background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}</style>

        {/* ── Header compacto (sin botón volver) ── */}
        <header className="h-12 border-b border-(--color-border) bg-(--color-bg) flex items-center px-4 shrink-0 justify-between z-10">
            <div className="flex items-center gap-3">
            {/* Nombre editable (tipo oculto por petición) */}
            <div className="flex items-center gap-2">
              <input
                className="bg-transparent border-b border-transparent hover:border-(--color-border) focus:border-(--color-accent) text-xs font-semibold text-(--color-text-primary) focus:outline-none px-1 py-0.5 transition-colors w-40"
                value={diagramName}
                onChange={e => setDiagramName(e.target.value)}
                placeholder="Sin nombre"
                title="Editar nombre del diagrama"
              />
            </div>

            {/* Estado + feedback */}
            <div className="flex items-center gap-2">
              {isGlobalLoading ? (
                <span className="text-[10px] text-(--color-accent) animate-pulse bg-(--color-accent-subtle) px-2 py-0.5 rounded-full border border-(--color-accent)/20">
                  Sincronizando
                </span>
              ) : editorState.status === 'editing' ? (
                <span className="text-[10px] text-(--color-text-muted) bg-(--color-surface) px-2 py-0.5 rounded-full border border-(--color-border)">
                  Editando
                </span>
              ) : (
                <span className="text-[10px] text-(--color-text-muted) bg-(--color-surface) px-2 py-0.5 rounded-full border border-(--color-border)">
                  Guardado
                </span>
              )}

              {saveFeedback && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${saveFeedback.type === 'success' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                  saveFeedback.type === 'error' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                    'text-(--color-accent) bg-(--color-accent-subtle) border-(--color-border)'
                  }`}>
                  {saveFeedback.message}
                </span>
              )}
            </div>
          </div>

          {/* Acciones compactas */}
            <div className="flex items-center gap-1.5">
            <button
              onClick={handleGenerateAutoDiagram}
              disabled={isGlobalLoading}
              className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-(--color-border) bg-(--color-bg-card) text-(--color-text-secondary) hover:bg-(--color-surface) transition-colors disabled:opacity-50"
              title="Generar diagrama con IA"
            >
              <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              IA
            </button>
            <button
              onClick={() => handleSaveDiagram(false)}
              disabled={isGlobalLoading || !diagramName.trim()}
              className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-(--color-accent) bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Guardar
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isGlobalLoading || !(selectedNodeId || selectedEdgeId)}
              className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
              title="Eliminar seleccionado"
            >
              <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
            {/* Properties button removed—panel opens on selection automatically */}
          </div>
        </header>

        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          {/* Floating add button (replaces left toolbar). DiagramToolbar shows a single + and expands into cards */}
          <div className="absolute left-4 top-6 z-30">
            <DiagramToolbar
              isSaved={Boolean(diagramId.trim())}
              isValid={validation.valid}
              hasSelection={Boolean(selectedNodeId || selectedEdgeId)}
              status={editorState.status}
              diagramType={diagramType}
              onAddElement={handleAddElement}
              onAddActor={handleAddActor}
              onAddUseCase={handleAddUseCase}
              onAddPackage={handleAddPackage}
              onAddPackageWithOptions={handleAddPackageWithOptions}
            />
          </div>

          {/* Área principal: Canvas */}
          <main className="flex-1 min-h-0 relative bg-(--color-bg) overflow-hidden">
            <DiagramCanvas
              nodes={nodes}
              edges={edges}
              diagramType={diagramType}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
                onSelectionChange={handleSelectionChange}
                onNodeDragStop={handleNodeDragStop}
            />
          </main>

          {/* Panel de propiedades flotante (Derecha) */}
          <aside
            className={`absolute right-4 top-6 bottom-6 z-30 transition-all duration-500 ease-in-out transform ${isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
              }`}
          >
            <div className="w-80 h-full bg-(--color-bg-card) dark:bg-[#0b0f12] border border-(--color-border) rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Propiedades</h3>
                  {editorTarget && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800/50">
                      {editorTarget === 'node' ? 'Elemento' : 'Relación'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-1">
                {!editorTarget ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                      <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Selecciona un elemento para editar sus propiedades</p>
                  </div>
                ) : (
                  <DiagramSidebar
                    editorTarget={editorTarget}
                    selectedNode={selectedNode?.data ?? null}
                    selectedEdge={selectedEdge?.data ?? null}
                    nodes={nodes.map(n => n.data)}
                    diagramType={diagramType}
                    onUpdateNode={updateNode}
                    onUpdateEdge={updateEdge}
                    onDeleteNode={handleDeleteNode}
                    onDeleteEdge={handleDeleteEdge}
                  />
                )}
              </div>
            </div>
          </aside>

          {/* Botón flotante para reabrir sidebar si está cerrada */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute right-4 top-4 z-20 w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex items-center justify-center text-slate-500 hover:text-blue-500 transition-all hover:scale-110"
              title="Abrir propiedades"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
        {/* ── Barra de ayuda flotante (overlay, no ocupa layout) ── */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-40">
          <div className="px-4 py-1 rounded-full bg-(--color-bg-card) border border-(--color-border) text-[10px] text-(--color-text-muted)">
            💡 {['Arrastra elementos para organizarlos', 'Conecta nodos desde sus puntos de enlace', 'Selecciona un elemento para editarlo', 'Guarda antes de generar PlantUML'][currentTipIndex]}
          </div>
        </div>

        {/* ── Modales ── */}
        {showValidationModal && validationResult && (
          <DiagramValidationModal
            result={validationResult}
            onClose={() => setShowValidationModal(false)}
            onConfirm={() => handleSaveDiagram(true)}
            onSelectIssue={handleSelectIssue}
          />
        )}

        {showAiModal && aiProposal && (
          <GeneratedDiagramReviewModal
            nodes={aiProposal.nodes}
            edges={aiProposal.edges}
            warnings={aiProposal.warnings}
            isCanvasEmpty={nodes.length === 0}
            diagramType={diagramType}
            onClose={handleCloseAiModal}
            onApplyReplace={handleApplyAiReplace}
            onApplyMerge={handleApplyAiMerge}
          />
        )}
      </div>
    </DiagramErrorBoundary>
  )
}

