import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { graphFacade } from '../facades/graph.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { requirementFacade } from '../facades/requirement.facade'
import { isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import type {
  RequirementDTO,
  RequirementNode,
  SearchResponse,
} from '../types/requirements'
import {
  RequirementDetailCard,
  RequirementNodeList,
  SearchResultList,
} from '../components/requirements/RequirementDataViews'
import { RequirementGraphView } from '../components/graph/RequirementGraphView'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'

const EMPTY_REQUIREMENT: RequirementDTO = {
  id: '',
  code: '',
  title: '',
  description: '',
  actors: [],
  acceptanceCriteria: [],
  isoClassification: '',
  projectId: '',
  relatedCodes: [],
}

export function RequirementsPage() {
  const { projectId: routeProjectId } = useParams()
  const { run, isLoading } = useApiOperation()
  const projectId = routeProjectId ?? ''

  const [text, setText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [requirement, setRequirement] = useState<RequirementDTO>({ ...EMPTY_REQUIREMENT, projectId })
  const [projectRequirements, setProjectRequirements] = useState<RequirementDTO[]>([])
  const [searchResults, setSearchResults] = useState<SearchResponse[]>([])
  const [impactResults, setImpactResults] = useState<RequirementNode[]>([])
  const [impactGraph, setImpactGraph] = useState<Record<string, unknown> | null>(null)
  const [inferenceGraph, setInferenceGraph] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (isValidProjectId(projectId)) {
      setRequirement((current) => ({ ...current, projectId }))
    }
  }, [projectId])

  useEffect(() => {
    if (!requirement.id.trim()) {
      setImpactGraph(null)
      return
    }
    void handleImpact()
  }, [requirement.id])

  async function handleConvert(): Promise<void> {
    if (!isValidProjectId(projectId) || !text.trim()) return
    const data = await run(() => requirementFacade.convertTextToRequirement(projectId, text.trim()), { errorMessage: 'Error al convertir.' })
    if (data) setRequirement(data)
  }

  async function handleSave(): Promise<void> {
    if (!requirement.title.trim() || !isValidProjectId(requirement.projectId)) return
    const data = await run(() => requirementFacade.saveRequirement(requirement), { errorMessage: 'Error al guardar.' })
    if (data) {
      setRequirement(data)
    }
  }

  async function handleSearch(): Promise<void> {
    if (!searchQuery.trim()) return
    const data = await run(() => requirementFacade.searchRequirements(searchQuery.trim()), { errorMessage: 'Error en búsqueda.' })
    if (data) setSearchResults(data)
  }

  async function handleLoadProjectRequirements(): Promise<void> {
    if (!isValidProjectId(projectId)) return
    const data = await run(() => requirementFacade.getRequirementsByProject(projectId), { errorMessage: 'Error al cargar.' })
    if (data) setProjectRequirements(data)
  }

  async function handleImpact(): Promise<void> {
    if (!requirement.id.trim()) return
    const data = await run(() => graphFacade.getImpact(requirement.id), { errorMessage: 'Error al consultar impacto.' })
    if (data) {
      setImpactResults(Array.isArray(data) ? (data as RequirementNode[]) : [])
      setImpactGraph(data)
    }
  }

  async function handleInferRelations(): Promise<void> {
    if (!isValidProjectId(projectId) || projectRequirements.length === 0) return
    const data = await run(() => graphFacade.inferRelations(projectId, projectRequirements), { errorMessage: 'Error al inferir.' })
    if (data) setInferenceGraph(data)
  }

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para gestionar requisitos." />
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col gap-2 border-b border-app-border pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Requisitos</h1>
          <Badge variant="neutral">Proyecto: {projectId.slice(0, 8)}</Badge>
        </div>
        <p className="app-text-secondary">Convierte lenguaje natural, analiza impacto y gestiona dependencias.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Editor Section */}
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] border border-app-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold app-text-secondary">Asistente AI</label>
              <textarea
                className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] min-h-[120px] focus:ring-2 focus:ring-app-accent/20 outline-none transition-all"
                placeholder="Escribe el requerimiento en lenguaje natural..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleConvert} isLoading={isLoading}>Convertir</Button>
                <Button onClick={handleSave} isLoading={isLoading}>Guardar Requisito</Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Código" value={requirement.code} onChange={e => setRequirement({ ...requirement, code: e.target.value })} />
              <Input label="Título" value={requirement.title} onChange={e => setRequirement({ ...requirement, title: e.target.value })} />
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[13px] font-medium app-text-secondary">Descripción</label>
                <textarea
                  className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] min-h-[100px] focus:ring-2 focus:ring-app-accent/20 outline-none transition-all"
                  value={requirement.description}
                  onChange={e => setRequirement({ ...requirement, description: e.target.value })}
                />
              </div>
            </div>

            <RequirementDetailCard requirement={requirement} />
          </div>
        </section>

        {/* Analysis Section */}
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] border border-app-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Análisis y Trazabilidad</h2>
              <div className="flex gap-2">
                <Input 
                  placeholder="Buscar requisitos..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
                <Button variant="secondary" onClick={handleSearch}>Buscar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={handleLoadProjectRequirements}>Cargar Proyecto</Button>
                <Button variant="ghost" size="sm" onClick={handleInferRelations}>Inferir Relaciones</Button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-app-text-muted">Resultados</h3>
                <div className="max-h-48 overflow-auto border rounded-lg p-2 bg-app-bg">
                  <SearchResultList results={searchResults} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-app-text-muted">Impacto</h3>
                <div className="max-h-48 overflow-auto border rounded-lg p-2 bg-app-bg">
                  <RequirementNodeList nodes={impactResults} emptyMessage="Sin datos." />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] border border-app-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Grafo de Dependencias</h3>
            <RequirementGraphView
              title="Impacto del Requisito"
              response={impactGraph}
              emptyMessage="Selecciona un requisito para visualizar dependencias."
            />
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] border border-app-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Relaciones Inferidas</h3>
            <RequirementGraphView
              title="Mapa de Trazabilidad"
              response={inferenceGraph}
              emptyMessage="Ejecuta la inferencia para ver el mapa completo."
            />
          </div>
        </section>
      </div>
    </div>
  )
}
