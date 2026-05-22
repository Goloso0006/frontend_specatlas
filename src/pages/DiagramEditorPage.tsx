import { useState } from 'react'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { DiagramCanvas } from '../components/diagram/DiagramCanvas'
import { DiagramToolbar } from '../components/diagram/DiagramToolbar'
import { DiagramValidationModal } from '../components/diagram/DiagramValidationModal'
import { GeneratedDiagramReviewModal } from '../components/diagram/GeneratedDiagramReviewModal'
import { DiagramErrorBoundary } from '../components/diagram/DiagramErrorBoundary'
import { DiagramHeader } from '../components/diagram/DiagramHeader'
import { DiagramPropertiesPanel } from '../components/diagram/DiagramPropertiesPanel'
import { UnsupportedDiagramView } from '../components/diagram/UnsupportedDiagramView'
import { DiagramQualityModal } from '../components/diagram/DiagramQualityModal'
import { useDiagramEditorController } from '../hooks/useDiagramEditorController'

export function DiagramEditorPage() {
  const controller = useDiagramEditorController()
  const [showQualityModal, setShowQualityModal] = useState(false)

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
    handleReconnect,
    handleAddElement,
    handleAddActor,
    handleAddUseCase,
    handleAddPackage,
    handleDeleteSelected,
    handleDeleteNode,
    handleDeleteEdge,
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop,
    updateNode,
    updateEdge,
    handleSaveDiagram,
    handleGenerateAutoDiagram,
    handleAutoLayout,
    handleCleanDuplicateEdges,
    handleApplyAiReplace,
    handleApplyAiMerge,
    handleCloseAiModal,
    handleSelectIssue,
    setDiagramName,
    setIsSidebarOpen,
    setShowValidationModal,
    sidebarTabPreference,
    setSidebarTabPreference,
    handleAlignNodes,
    handleDistributeNodes,
    handleGroupIntoPackage,
    handleDuplicateSelected,
    handleDuplicateNode,
    handleQuickAddAttribute,
    handleQuickAddMethod,
    handleQuickCreateRelation,
    handleQuickAddInclude,
    handleQuickAddExtend,
    handleQuickAddToPackage,
    setSelectedNodeId,
    setEditorTarget,
    clearSelection,
    // History, dirty checks
    canUndo,
    canRedo,
    isDirty,
    lastSavedTime,
    handleUndo,
    handleRedo,
    handleBack,
  } = controller

  /* ── Guards ── */
  if (!projectId) {
    return <NoProjectSelected message="Selecciona un proyecto válido para administrar diagramas." />
  }

  if (!isTypeSupported && !diagramId) {
    return <UnsupportedDiagramView onBack={() => window.history.back()} />
  }

  /* ── Render ── */
  return (
    <DiagramErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-96px)] min-h-0 bg-(--color-bg) overflow-hidden">
        <style>{`
          .canvas-bg {
            background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}</style>

        <DiagramHeader
          diagramName={diagramName}
          setDiagramName={setDiagramName}
          isGlobalLoading={isGlobalLoading}
          status={editorState.status}
          saveFeedback={saveFeedback}
          hasSelection={Boolean(selectedNodeId || selectedEdgeId)}
          onGenerateAutoDiagram={handleGenerateAutoDiagram}
          onSaveDiagram={handleSaveDiagram}
          onDeleteSelected={handleDeleteSelected}
          isDirty={isDirty}
          lastSavedTime={lastSavedTime}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          diagramType={diagramType}
          onBack={handleBack}
        />

        <div className="flex-1 min-h-0 flex overflow-hidden relative rounded-[1.75rem] border border-(--color-border-strong) bg-(--color-bg-card) shadow-[0_24px_80px_rgba(43,43,43,0.08)]">
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
              onAutoLayout={handleAutoLayout}
            />
          </div>

          <main className="flex-1 min-h-0 relative bg-(--color-bg) overflow-hidden">
            <DiagramCanvas
              nodes={nodes}
              edges={edges}
              diagramType={diagramType}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onReconnect={handleReconnect}
              onSelectionChange={handleSelectionChange}
              onNodeDragStart={handleNodeDragStart}
              onNodeDrag={handleNodeDrag}
              onNodeDragStop={handleNodeDragStop}
              onPaneClick={clearSelection}
              onOpenQualityPanel={() => setShowQualityModal(true)}
              onAlignNodes={handleAlignNodes}
              onDistributeNodes={handleDistributeNodes}
              onGroupIntoPackage={handleGroupIntoPackage}
              onDuplicateSelected={handleDuplicateSelected}
              onDeleteSelected={handleDeleteSelected}
              onEditNode={(id) => { setSelectedNodeId(id); setEditorTarget('node'); setIsSidebarOpen(true) }}
              onDuplicateNode={handleDuplicateNode}
              onAddAttribute={handleQuickAddAttribute}
              onAddMethod={handleQuickAddMethod}
              onCreateRelation={handleQuickCreateRelation}
              onAddInclude={handleQuickAddInclude}
              onAddExtend={handleQuickAddExtend}
              onAddToPackage={handleQuickAddToPackage}
              onDeleteNode={handleDeleteNode}
              onUpdateEdge={updateEdge}
              onSaveDiagram={handleSaveDiagram}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onAddActor={handleAddActor}
            />
          </main>

          <DiagramPropertiesPanel
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            editorTarget={editorTarget}
            selectedNode={selectedNode?.data ?? null}
            selectedEdge={selectedEdge?.data ?? null}
            nodes={nodes.map(n => n.data)}
            diagramType={diagramType}
            updateNode={updateNode}
            updateEdge={updateEdge}
            onDeleteNode={handleDeleteNode}
            onDeleteEdge={handleDeleteEdge}
            onClose={() => { setIsSidebarOpen(false); clearSelection() }}
            sidebarTabPreference={sidebarTabPreference}
            setSidebarTabPreference={setSidebarTabPreference}
            projectId={projectId}
          />
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-40">
          <div className="px-4 py-1 rounded-full bg-(--color-bg-card) border border-(--color-border) text-[10px] text-(--color-text-muted)">
            💡 {['Arrastra elementos para organizarlos', 'Conecta nodos desde sus puntos de enlace', 'Selecciona un elemento para editarlo', 'Guarda antes de generar PlantUML'][currentTipIndex]}
          </div>
        </div>

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

        {showQualityModal && (
          <DiagramQualityModal
            nodes={nodes.map(n => n.data)}
            edges={edges.map(e => e.data as any)}
            diagramType={diagramType}
            isAutoGenerated={nodes.some(n => n.id.includes('actor') || n.id.includes('usecase') || n.id.includes('class') || n.id.includes('package'))}
            lastSavedStatus={saveFeedback ? `${saveFeedback.type === 'success' ? '✓' : '⚠️'} ${saveFeedback.message}` : undefined}
            onClose={() => setShowQualityModal(false)}
            onSelectElement={(type, id) => {
              handleSelectIssue(type, id)
              setShowQualityModal(false)
            }}
            onAutoLayout={handleAutoLayout}
            onCleanDuplicates={handleCleanDuplicateEdges}
          />
        )}
      </div>
    </DiagramErrorBoundary>
  )
}
