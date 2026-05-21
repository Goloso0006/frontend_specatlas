import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { projectsApi } from '../api/services/projectsApi'
import { requirementsApi } from '../api/services/requirementsApi'
import type { ProjectReport } from '../types/projects'
import type { RequirementDTO } from '../types/requirements'

export default function ProjectReportsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [reports, setReports] = useState<ProjectReport[]>([])
  const [selectedReport, setSelectedReport] = useState<ProjectReport | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (projectId) {
      void loadReports()
    }
  }, [projectId])

  const loadReports = async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const data = await projectsApi.getReports(projectId)
      setReports(data || [])
    } catch (err) {
      console.error('Error al cargar reportes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateReport = async () => {
    if (!projectId) return
    try {
      const newReport = await projectsApi.createReport(projectId, {
        title: 'Nuevo Reporte de Ingeniería',
        content: '# Título del Reporte\n\nEste es un reporte vivo del proyecto.\n\n{{REQUISITOS_TABLA}}\n\nFin del reporte.'
      })
      setReports(prev => [newReport, ...prev])
      handleSelectReport(newReport)
    } catch (err) {
      console.error('Error al crear reporte:', err)
    }
  }

  const handleSelectReport = (report: ProjectReport) => {
    setSelectedReport(report)
    setTitle(report.title)
    setContent(report.content)
    setIsEditing(true)
    setActiveTab('edit')
  }

  const handleSaveReport = async () => {
    if (!projectId || !selectedReport) return
    try {
      const updated = await projectsApi.updateReport(projectId, selectedReport.id, {
        title,
        content
      })
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r))
      setSelectedReport(updated)
      // Show saved toast/feedback if needed
    } catch (err) {
      console.error('Error al guardar reporte:', err)
    }
  }

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!projectId) return
    const confirm = window.confirm('¿Estás seguro de que deseas eliminar este reporte de forma permanente?')
    if (!confirm) return
    try {
      await projectsApi.deleteReport(projectId, reportId)
      setReports(prev => prev.filter(r => r.id !== reportId))
      if (selectedReport?.id === reportId) {
        setIsEditing(false)
        setSelectedReport(null)
      }
    } catch (err) {
      console.error('Error al eliminar reporte:', err)
    }
  }

  const handleInsertTable = () => {
    const textToInsert = '{{REQUISITOS_TABLA}}'
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + textToInsert + content.substring(end)
      setContent(newContent)
      // Put focus back to textarea
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
      }, 0)
    } else {
      setContent(prev => prev + '\n' + textToInsert + '\n')
    }
  }

  return (
    <div className="w-full h-full min-h-[calc(100vh-80px)] flex bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-md font-black tracking-tight text-white flex items-center gap-2">
            <span>📚</span> Documentación Viva
          </h2>
          <button
            onClick={handleCreateReport}
            className="p-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
          >
            <span>+</span> Nuevo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-500">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px]">Cargando reportes...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-1">
              <span className="text-2xl block">📁</span>
              <p className="text-[11px]">No hay documentos creados aún.</p>
            </div>
          ) : (
            reports.map(report => (
              <div
                key={report.id}
                onClick={() => handleSelectReport(report)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 group relative overflow-hidden ${
                  selectedReport?.id === report.id
                    ? 'bg-indigo-600/10 border-indigo-500/80 shadow-md shadow-indigo-500/5'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {report.title}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteReport(report.id, e)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 transition-all"
                    title="Eliminar reporte"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <span className="text-[9px] text-slate-500 font-medium">
                  Modificado: {new Date(report.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor / Preview Panel */}
      <div className="flex-1 flex flex-col bg-slate-950/20 relative">
        {isEditing && selectedReport ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header Control Toolbar */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/20 backdrop-blur-sm">
              <div className="flex-1 max-w-lg">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveReport}
                  className="w-full bg-transparent text-white font-extrabold text-lg focus:outline-none border-b border-transparent focus:border-indigo-500/60 pb-0.5 placeholder:text-slate-600"
                  placeholder="Título de la Documentación"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Tabs */}
                <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex items-center">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`px-3 py-1 rounded-md text-[11px] font-black tracking-tight transition-all ${
                      activeTab === 'edit'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-md text-[11px] font-black tracking-tight transition-all ${
                      activeTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    👁️ Vista Previa
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-800" />

                <button
                  onClick={handleSaveReport}
                  className="p-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-md"
                >
                  💾 Guardar
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'edit' ? (
                <div className="h-full flex flex-col">
                  {/* Rich Editing Bar */}
                  <div className="p-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5">
                    <button
                      onClick={handleInsertTable}
                      className="p-1.5 px-3 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/25 hover:text-indigo-300 font-bold text-[10px] flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-950/20"
                    >
                      📊 Incrustar Tabla de Requisitos
                    </button>
                    <span className="text-[10px] text-slate-500 select-none">
                      (Inserta la etiqueta <code>{"{{REQUISITOS_TABLA}}"}</code> en vivo)
                    </span>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 w-full bg-slate-950 border-none outline-none resize-none p-6 text-sm text-slate-300 font-mono leading-relaxed placeholder:text-slate-700 custom-scrollbar"
                    placeholder="# Escribe aquí en formato Markdown...&#10;&#10;Usa el botón de arriba para incrustar la tabla interactiva."
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-8 leading-relaxed custom-scrollbar bg-slate-950">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-2xl font-black text-white pb-3 border-b border-slate-800/80">
                      {title}
                    </h1>
                    <LiveDocumentRenderer content={content} projectId={projectId || ''} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shadow-xl">
              📝
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-sm text-slate-300">Ningún documento seleccionado</h3>
              <p className="text-[11px] max-w-sm leading-relaxed">
                Selecciona un reporte de ingeniería en la barra lateral o crea uno nuevo para empezar a redactar documentación viva de requisitos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LiveDocumentRenderer({ content, projectId }: { content: string; projectId: string }) {
  if (!content) return null

  // Split content by {{REQUISITOS_TABLA}}
  const parts = content.split('{{REQUISITOS_TABLA}}')
  if (parts.length === 1) {
    return <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
  }

  return (
    <div className="space-y-6">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part && (
            <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {part}
            </div>
          )}
          {index < parts.length - 1 && (
            <div className="my-6 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-900/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 bg-indigo-600/10 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <span className="animate-pulse">🟢</span> Tabla Viva de Requisitos del Proyecto
                </span>
                <span className="text-[9px] font-bold text-slate-500">
                  Sincronizado en tiempo real
                </span>
              </div>
              <LiveRequirementsTable projectId={projectId} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function LiveRequirementsTable({ projectId }: { projectId: string }) {
  const [requirements, setRequirements] = useState<RequirementDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'ALL' | 'FUNCTIONAL' | 'NON_FUNCTIONAL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchReqs = async () => {
      try {
        const data = await requirementsApi.getByProject(projectId)
        setRequirements(data || [])
      } catch (err) {
        console.error('Error fetching live requirements in Wiki:', err)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchReqs()
  }, [projectId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-500 bg-slate-900/10">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Consultando base de requisitos...</span>
      </div>
    )
  }

  const filtered = requirements.filter(req => {
    const matchesType = 
      filterType === 'ALL' || 
      (filterType === 'FUNCTIONAL' && req.requirementType === 'FUNCTIONAL') ||
      (filterType === 'NON_FUNCTIONAL' && req.requirementType === 'NON_FUNCTIONAL')

    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = 
      !query || 
      req.code.toLowerCase().includes(query) ||
      req.title.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query)

    return matchesType && matchesSearch
  })

  return (
    <div className="p-4 space-y-4 bg-slate-950/40">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por código, título o descripción..."
            className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-600"
          />
        </div>

        {/* Filter buttons */}
        <div className="bg-slate-900 p-0.5 rounded-lg flex border border-slate-800/80 w-full sm:w-auto">
          {(['ALL', 'FUNCTIONAL', 'NON_FUNCTIONAL'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold tracking-tight uppercase transition-all ${
                filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type === 'FUNCTIONAL' ? 'Funcional' : 'No Funcional'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List for elegant presentation */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs italic">
          No se encontraron requisitos que coincidan con los filtros.
        </div>
      ) : (
        <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-900/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold">
                <th className="p-3 w-24">Código</th>
                <th className="p-3 w-1/4">Título</th>
                <th className="p-3">Descripción</th>
                <th className="p-3 w-28 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filtered.map(req => (
                <tr key={req.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-3 font-mono font-black text-indigo-400 align-top">
                    {req.code}
                  </td>
                  <td className="p-3 font-bold text-slate-200 align-top">
                    {req.title}
                  </td>
                  <td className="p-3 text-slate-400 leading-relaxed whitespace-pre-wrap align-top">
                    {req.description}
                  </td>
                  <td className="p-3 text-center align-top">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      req.requirementType === 'FUNCTIONAL'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {req.requirementType === 'FUNCTIONAL' ? 'Funcional' : 'No Funcional'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
