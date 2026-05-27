import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsApi } from '../api/services/projectsApi'
import { requirementsApi } from '../api/services/requirementsApi'
import { diagramsApi } from '../api/services/diagramsApi'
import type { ProjectReport } from '../types/projects'
import type { RequirementDTO } from '../types/requirements'
import type { DiagramSummaryResponse, DiagramResponse, DiagramSourceDTO, DiagramNodeDTO, DiagramRelationDTO } from '../types/diagrams'
import html2canvas from 'html2canvas'

export default function ProjectReportsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [reports, setReports] = useState<ProjectReport[]>([])
  const [selectedReport, setSelectedReport] = useState<ProjectReport | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  // Command palette state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [projectDiagrams, setProjectDiagrams] = useState<DiagramSummaryResponse[]>([])
  const [isLoadingDiagrams, setIsLoadingDiagrams] = useState(false)

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
        content: '# Título del Reporte\n\nEste es un reporte vivo del proyecto.\n\nEscribe /// para abrir la paleta de comandos o usa los botones de inserción rápida.\n\n{{REQUISITOS_TABLA}}\n\nFin del reporte.'
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

  const latestDataRef = useRef({ title, content, id: selectedReport?.id });
  useEffect(() => {
    latestDataRef.current = { title, content, id: selectedReport?.id };
  }, [title, content, selectedReport]);

  // Guardado al salir de la página
  useEffect(() => {
    return () => {
      const data = latestDataRef.current;
      if (projectId && data.id) {
        projectsApi.updateReport(projectId, data.id, { title: data.title, content: data.content }).catch(() => {});
      }
    };
  }, [projectId]);

  // Guardado automático (Debounce)
  useEffect(() => {
    if (!selectedReport || !projectId) return;
    if (selectedReport.title === title && selectedReport.content === content) return;

    const timer = setTimeout(async () => {
      try {
        const updated = await projectsApi.updateReport(projectId, selectedReport.id, { title, content });
        setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        setSelectedReport(updated);
      } catch (err) {
        console.error('Error auto-guardando:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, content, projectId, selectedReport]);

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

  // Intercept textarea changes for command palette trigger
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)

    // Check if user just typed the triple slash trigger "///"
    const cursorPosition = e.target.selectionStart
    const textBeforeCursor = val.substring(0, cursorPosition)
    if (textBeforeCursor.endsWith('///')) {
      const cleaned = val.substring(0, cursorPosition - 3) + val.substring(cursorPosition)
      setContent(cleaned)
      void openCommandPalette()
    }
  }

  const openCommandPalette = async () => {
    setIsPaletteOpen(true)
    if (!projectId) return
    setIsLoadingDiagrams(true)
    try {
      const diagrams = await diagramsApi.listByProject(projectId)
      setProjectDiagrams(diagrams || [])
    } catch (err) {
      console.error('Error al cargar diagramas para paleta:', err)
    } finally {
      setIsLoadingDiagrams(false)
    }
  }

  const insertTagAtCursor = (tag: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + tag + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + tag.length, start + tag.length)
      }, 0)
    } else {
      setContent(prev => prev + '\n' + tag + '\n')
    }
    setIsPaletteOpen(false)
  }

  // Exports
  const handleExportPDF = () => {
    window.print()
  }

  const handleExportWord = async () => {
    if (!selectedReport) return
    
    // Quick HTML representation to wrap as MS Word
    const htmlHeader = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h1 { color: #4F46E5; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
        h2 { color: #1E1B4B; margin-top: 24px; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid #D1D5DB; padding: 10px; text-align: left; }
        th { background-color: #F3F4F6; font-weight: bold; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
        .functional { background-color: #EEF2FF; color: #4F46E5; }
        .non-functional { background-color: #ECFDF5; color: #059669; }
      </style>
      </head>
      <body>
    `
    const htmlFooter = `</body></html>`
    
    // Resolve requirements table to plain HTML if tag present
    let docContent = content
    if (content.includes('{{REQUISITOS_TABLA}}') && projectId) {
      try {
        const reqs = await requirementsApi.getByProject(projectId)
        let tableHtml = `
          <table>
            <thead>
              <tr style="background-color: #F3F4F6;">
                <th>C&oacute;digo</th>
                <th>T&iacute;tulo</th>
                <th>Descripci&oacute;n</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
        `
        reqs.forEach(r => {
          tableHtml += `
            <tr>
              <td style="font-family: monospace; font-weight: bold;">${r.code}</td>
              <td><b>${r.title}</b></td>
              <td>${r.description}</td>
              <td><span class="tag ${r.requirementType === 'FUNCTIONAL' ? 'functional' : 'non-functional'}">${r.requirementType === 'FUNCTIONAL' ? 'Funcional' : 'No Funcional'}</span></td>
            </tr>
          `
        })
        tableHtml += `</tbody></table>`
        docContent = docContent.replace(/\{\{REQUISITOS_TABLA\}\}/g, tableHtml)
      } catch (err) {
        console.error('Error generating table HTML for Word export:', err)
      }
    }

    // Resolve diagrams using html2canvas
    const diagramRegex = /\{\{DIAGRAMA:([^:]+):[^}]+\}\}/g;
    let match;
    const diagramsToCapture = new Set<string>();
    
    const contentToParse = docContent;
    while ((match = diagramRegex.exec(contentToParse)) !== null) {
      diagramsToCapture.add(match[1]);
    }

    if (diagramsToCapture.size > 0) {
      const diagramElements = document.querySelectorAll('.exportable-diagram-canvas');
      const diagramImages: Record<string, string> = {};
      
      for (const el of Array.from(diagramElements)) {
        const diagId = el.getAttribute('data-diagram-id');
        if (diagId && diagramsToCapture.has(diagId)) {
          try {
            const canvas = await html2canvas(el as HTMLElement, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff'
            });
            diagramImages[diagId] = canvas.toDataURL('image/png');
          } catch (err) {
            console.error('Error capturing diagram for Word export:', err);
          }
        }
      }

      // Replace tags with the captured base64 images
      docContent = docContent.replace(/\{\{DIAGRAMA:([^:]+):[^}]+\}\}/g, (_fullMatch, diagId) => {
        if (diagramImages[diagId]) {
          return `<div style="text-align: center; margin: 20px 0;"><img src="${diagramImages[diagId]}" style="width: 100%; max-width: 600px; height: auto; border: 1px solid #D1D5DB; border-radius: 8px;" /></div>`;
        }
        return '<i>[Diagrama no pudo ser renderizado para exportación]</i>';
      });
    }

    // Parse simple markdown headings to basic HTML
    const formattedBody = docContent
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br />')

    const fileContent = htmlHeader + `<h1>${title}</h1>` + formattedBody + htmlFooter
    const blob = new Blob([fileContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_specatlas.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full h-full min-h-[calc(100vh-80px)] flex bg-[var(--color-bg)] text-[var(--color-text-primary)] font-sans print:bg-white print:text-black">
      {/* Dynamic media CSS for premium print layout */}
      <style>{`
        @media print {
          aside, nav, header, button, .no-print, .rich-bar {
            display: none !important;
          }
          body, .print\\:bg-white {
            background: white !important;
            color: black !important;
          }
          .custom-scrollbar {
            overflow: visible !important;
          }
          .print-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Sidebar List */}
      <div className="w-80 border-r border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col flex-shrink-0 no-print">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-sm font-black tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="text-[var(--color-accent)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Wiki del Proyecto
          </h2>
          <button
            onClick={handleCreateReport}
            className="p-1.5 px-3 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
          >
            <span>+</span> Nuevo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-[var(--color-text-muted)]">
              <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px]">Cargando reportes...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)] space-y-1">
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
                    ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)]'
                    : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                    {report.title}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteReport(report.id, e)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] text-[var(--color-text-muted)] transition-all"
                    title="Eliminar reporte"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <span className="text-[9px] text-[var(--color-text-muted)] font-medium">
                  Modificado: {new Date(report.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor / Preview Panel */}
      <div className="flex-1 flex flex-col bg-[var(--color-bg)] relative print-content">
        {isEditing && selectedReport ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header Control Toolbar */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-card)] no-print">
              <div className="flex-1 max-w-lg">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-[var(--color-text-primary)] font-extrabold text-lg focus:outline-none border-b border-transparent focus:border-[var(--color-accent)] pb-0.5 placeholder:text-[var(--color-text-muted)]"
                  placeholder="Título de la Documentación"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Tabs */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-0.5 rounded-lg flex items-center">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`px-3 py-1 rounded-md text-[11px] font-black tracking-tight transition-all ${
                      activeTab === 'edit'
                        ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-md text-[11px] font-black tracking-tight transition-all ${
                      activeTab === 'preview'
                        ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    👁️ Vista Previa
                  </button>
                </div>

                <div className="h-4 w-px bg-[var(--color-border)]" />

                {/* Exports */}
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'pdf') handleExportPDF();
                    if (val === 'word') handleExportWord();
                    e.target.value = '';
                  }}
                  className="p-1.5 pl-3 pr-8 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] font-bold text-xs transition-all cursor-pointer outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="" disabled hidden>📤 Exportar</option>
                  <option value="pdf">📄 PDF</option>
                  <option value="word">📝 Word</option>
                </select>

              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative print-content">
              {activeTab === 'edit' ? (
                <div className="h-full flex flex-col">
                  {/* Rich Editing Bar */}
                  <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1.5 rich-bar overflow-x-auto">
                    <button
                      onClick={() => insertTagAtCursor('{{REQUISITOS_TABLA}}')}
                      className="p-1.5 px-3 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:opacity-80 font-bold text-[10px] flex items-center gap-1.5 transition-all shrink-0"
                    >
                      📊 Requisitos (Todos)
                    </button>
                    <button
                      onClick={() => insertTagAtCursor('{{REQUISITOS_TABLA_FUNCIONAL}}')}
                      className="p-1.5 px-3 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:opacity-80 font-bold text-[10px] flex items-center gap-1.5 transition-all shrink-0"
                    >
                      ⚙️ Funcionales
                    </button>
                    <button
                      onClick={() => insertTagAtCursor('{{REQUISITOS_TABLA_NO_FUNCIONAL}}')}
                      className="p-1.5 px-3 rounded-lg bg-[var(--color-success-subtle)] border border-[var(--color-success)]/30 text-[var(--color-success)] hover:opacity-80 font-bold text-[10px] flex items-center gap-1.5 transition-all shrink-0"
                    >
                      🛡️ No Funcionales
                    </button>
                    <button
                      onClick={() => void openCommandPalette()}
                      className="p-1.5 px-3 rounded-lg bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/30 text-[var(--color-warning)] hover:opacity-80 font-bold text-[10px] flex items-center gap-1.5 transition-all shrink-0"
                    >
                      🎨 Importar Diagrama
                    </button>
                    <button
                      onClick={() => insertTagAtCursor(`[🔗 Ir a Requisitos](/app/projects/${projectId}/requirements)`)}
                      className="p-1.5 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] font-bold text-[10px] flex items-center gap-1.5 transition-all shrink-0"
                    >
                      🔗 Enlace a Tablas
                    </button>
                    <span className="text-[10px] text-[var(--color-text-muted)] select-none ml-auto hidden md:inline shrink-0">
                      Escribe <code>///</code> para abrir el menú de comandos en cualquier parte.
                    </span>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextareaChange}
                    className="flex-1 w-full bg-[var(--color-bg)] border-none outline-none resize-none p-6 text-sm text-[var(--color-text-secondary)] font-mono leading-relaxed placeholder:text-[var(--color-text-muted)] custom-scrollbar"
                    placeholder="# Escribe aquí en formato Markdown...&#10;&#10;Escribe /// en cualquier parte del documento para insertar requerimientos, diagramas del proyecto o enlaces dinámicos."
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-8 leading-relaxed custom-scrollbar bg-[var(--color-bg)] print:bg-white print:text-black print:p-0">
                  <div className="max-w-4xl mx-auto space-y-6 print:max-w-full">
                    <h1 className="text-2xl font-black text-[var(--color-text-primary)] pb-3 border-b border-[var(--color-border)] print:text-black print:border-black">
                      {title}
                    </h1>
                    <LiveDocumentRenderer content={content} projectId={projectId || ''} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-[var(--color-text-muted)] space-y-3 no-print">
            <div className="w-16 h-16 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-xl">
              📝
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-sm text-[var(--color-text-secondary)]">Ningún documento seleccionado</h3>
              <p className="text-[11px] max-w-sm leading-relaxed">
                Selecciona un reporte de ingeniería en la barra lateral o crea uno nuevo para empezar a redactar documentación viva de requisitos.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modern Command Palette Modal */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                ⚡ Paleta de Comandos Wiki
              </h3>
              <button
                onClick={() => setIsPaletteOpen(false)}
                className="p-1 hover:bg-[var(--color-surface)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all text-xs"
              >
                Cerrar (Esc)
              </button>
            </div>

             <div className="space-y-2">
              <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wide">Comandos Básicos</p>
              <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                <button
                  onClick={() => insertTagAtCursor('{{REQUISITOS_TABLA}}')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] border border-transparent hover:border-[var(--color-accent)]/20 text-xs font-bold transition-all flex items-center justify-between text-[var(--color-text-secondary)]"
                >
                  <span>📊 Incrustar Todos los Requisitos</span>
                  <span className="text-[9px] font-mono text-[var(--color-text-muted)]">{"{{REQUISITOS_TABLA}}"}</span>
                </button>
                <button
                  onClick={() => insertTagAtCursor('{{REQUISITOS_TABLA_FUNCIONAL}}')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] border border-transparent hover:border-[var(--color-accent)]/20 text-xs font-bold transition-all flex items-center justify-between text-[var(--color-text-secondary)]"
                >
                  <span>⚙️ Incrustar Requisitos Funcionales</span>
                  <span className="text-[9px] font-mono text-[var(--color-text-muted)]">{"{{REQUISITOS_TABLA_FUNCIONAL}}"}</span>
                </button>
                <button
                  onClick={() => insertTagAtCursor('{{REQUISITOS_TABLA_NO_FUNCIONAL}}')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] border border-transparent hover:border-[var(--color-accent)]/20 text-xs font-bold transition-all flex items-center justify-between text-[var(--color-text-secondary)]"
                >
                  <span>🛡️ Incrustar Requisitos No Funcionales</span>
                  <span className="text-[9px] font-mono text-[var(--color-text-muted)]">{"{{REQUISITOS_TABLA_NO_FUNCIONAL}}"}</span>
                </button>
                <button
                  onClick={() => insertTagAtCursor(`[🔗 Ir a Requisitos](/app/projects/${projectId}/requirements)`)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] border border-transparent hover:border-[var(--color-accent)]/20 text-xs font-bold transition-all flex items-center justify-between text-[var(--color-text-secondary)]"
                >
                  <span>🔗 Insertar Enlace al Workspace de Requisitos</span>
                  <span className="text-[9px] font-mono text-[var(--color-text-muted)]">Enlace</span>
                </button>
                <button
                  onClick={() => insertTagAtCursor(`[🎨 Ir a Lienzo de Diagramas](/app/projects/${projectId}/diagrams)`)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] border border-transparent hover:border-[var(--color-accent)]/20 text-xs font-bold transition-all flex items-center justify-between text-[var(--color-text-secondary)]"
                >
                  <span>🔗 Insertar Enlace a Canvas de Diagramas</span>
                  <span className="text-[9px] font-mono text-[var(--color-text-muted)]">Enlace</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wide">Importar Diagrama Activo</p>
              {isLoadingDiagrams ? (
                <div className="text-center py-4 text-[10px] text-[var(--color-text-muted)]">Cargando diagramas...</div>
              ) : projectDiagrams.length === 0 ? (
                <div className="text-center py-4 text-[10px] text-[var(--color-text-muted)]">No hay diagramas creados en este proyecto. Crea uno primero.</div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                  {projectDiagrams.map(diag => (
                    <button
                      key={diag.id}
                      onClick={() => insertTagAtCursor(`{{DIAGRAMA:${diag.id}:${diag.name}}}`)}
                      className="w-full text-left p-2.5 px-3.5 rounded-xl hover:bg-[var(--color-warning-subtle)] hover:text-[var(--color-warning)] border border-transparent hover:border-[var(--color-warning)]/20 text-xs font-bold transition-all flex items-center justify-between text-[var(--color-text-secondary)]"
                    >
                      <span className="flex items-center gap-2">
                        <span>🎨</span> {diag.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider bg-[var(--color-surface)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-md font-black">
                        {diag.diagramType === 'CLASS' ? 'Clases' : 'Casos Uso'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LiveDocumentRenderer({ content, projectId }: { content: string; projectId: string }) {
  if (!content) return null

  // Highly robust line-by-line custom parser for premium document formatting
  const lines = content.split('\n')
  
  const parseLine = (line: string, index: number) => {
    const trimmed = line.trim()
    
    // Check custom tags
    if (trimmed === '{{REQUISITOS_TABLA}}') {
      return (
        <div key={index} className="my-6 border border-[var(--color-border-strong)] rounded-2xl overflow-hidden shadow-2xl bg-[var(--color-surface)]/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300 print:border-black print:shadow-none">
          <div className="p-4 bg-[var(--color-accent-subtle)] border-b border-[var(--color-border-strong)] flex items-center justify-between print:border-black print:bg-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5 print:text-black">
              <span>🟢</span> Tabla de Requisitos del Proyecto
            </span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] print:text-black">
              Sincronizado en tiempo real
            </span>
          </div>
          <LiveRequirementsTable defaultFilter="ALL" projectId={projectId} />
        </div>
      )
    }

    if (trimmed === '{{REQUISITOS_TABLA_FUNCIONAL}}') {
      return (
        <div key={index} className="my-6 border border-[var(--color-border-strong)] rounded-2xl overflow-hidden shadow-2xl bg-[var(--color-surface)]/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300 print:border-black print:shadow-none">
          <div className="p-4 bg-[var(--color-accent-subtle)] border-b border-[var(--color-border-strong)] flex items-center justify-between print:border-black print:bg-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5 print:text-black">
              <span>⚙️</span> Tabla de Requisitos Funcionales
            </span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] print:text-black">
              Sincronizado en tiempo real
            </span>
          </div>
          <LiveRequirementsTable defaultFilter="FUNCTIONAL" projectId={projectId} />
        </div>
      )
    }

    if (trimmed === '{{REQUISITOS_TABLA_NO_FUNCIONAL}}') {
      return (
        <div key={index} className="my-6 border border-[var(--color-border-strong)] rounded-2xl overflow-hidden shadow-2xl bg-[var(--color-surface)]/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300 print:border-black print:shadow-none">
          <div className="p-4 bg-[var(--color-success-subtle)] border-b border-[var(--color-border-strong)] flex items-center justify-between print:border-black print:bg-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--color-success)] flex items-center gap-1.5 print:text-black">
              <span>🛡️</span> Tabla de Requisitos No Funcionales
            </span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] print:text-black">
              Sincronizado en tiempo real
            </span>
          </div>
          <LiveRequirementsTable defaultFilter="NON_FUNCTIONAL" projectId={projectId} />
        </div>
      )
    }

    if (trimmed.startsWith('{{DIAGRAMA:') && trimmed.endsWith('}}')) {
      const parts = trimmed.substring(11, trimmed.length - 2).split(':')
      const diagId = parts[0]
      const diagName = parts[1] || 'Diagrama Sin Nombre'
      return (
        <div key={index} className="my-6 border border-[var(--color-border-strong)] rounded-2xl overflow-hidden shadow-2xl bg-[var(--color-surface)]/50 backdrop-blur-sm animate-in fade-in duration-300 print:border-black print:shadow-none">
          <div className="p-4 bg-[var(--color-warning-subtle)] border-b border-[var(--color-border-strong)] flex items-center justify-between print:border-black print:bg-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--color-warning)] flex items-center gap-1.5 print:text-black">
              <span>🎨</span> Modelo Visual: {diagName}
            </span>
          </div>
          <LiveDiagramPreview diagramId={diagId} />
        </div>
      )
    }

    // Parse Headings
    if (trimmed.startsWith('# ')) {
      return <h1 key={index} className="text-xl font-black text-[var(--color-text-primary)] mt-6 mb-2 print:text-black">{trimmed.substring(2)}</h1>
    }
    if (trimmed.startsWith('## ')) {
      return <h2 key={index} className="text-base font-black text-[var(--color-accent)] mt-5 mb-2 print:text-black print:text-sm">{trimmed.substring(3)}</h2>
    }
    if (trimmed.startsWith('### ')) {
      return <h3 key={index} className="text-sm font-bold text-[var(--color-text-secondary)] mt-4 mb-1 print:text-black">{trimmed.substring(4)}</h3>
    }

    // Parse bullet points
    if (trimmed.startsWith('- ')) {
      return (
        <ul key={index} className="list-disc pl-5 text-sm text-[var(--color-text-secondary)] space-y-1 print:text-black">
          <li>{parseMarkdownLinks(trimmed.substring(2))}</li>
        </ul>
      )
    }

    // Default line rendering
    return (
      <p key={index} className="text-sm text-[var(--color-text-secondary)] leading-relaxed min-h-[1rem] whitespace-pre-wrap print:text-black">
        {parseMarkdownLinks(line)}
      </p>
    )
  }

  return (
    <div className="space-y-3 print:space-y-4 print:text-black">
      {lines.map((line, index) => parseLine(line, index))}
    </div>
  )
}

// Inline Markdown link parser helper [Text](URL)
function parseMarkdownLinks(text: string): React.ReactNode {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    const linkText = match[1]
    const linkUrl = match[2]
    const index = match.index

    // Add prefix text
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index))
    }

    // Add beautifully styled Link component
    parts.push(
      <Link
        key={index}
        to={linkUrl}
        className="inline-flex items-center gap-1 p-1 px-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 text-xs font-bold transition-all shadow-sm print:text-blue-600 print:underline print:bg-transparent print:border-none print:p-0 no-print"
      >
        <span>🔗</span> {linkText}
      </Link>
    )
    
    // Fallback printable text representation
    parts.push(
      <span key={`print-${index}`} className="hidden print:inline font-bold text-black underline">
        {linkText}
      </span>
    )

    lastIndex = linkRegex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : text
}

function LiveRequirementsTable({ projectId, defaultFilter = 'ALL' }: { projectId: string; defaultFilter?: 'ALL' | 'FUNCTIONAL' | 'NON_FUNCTIONAL' }) {
  const [requirements, setRequirements] = useState<RequirementDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'ALL' | 'FUNCTIONAL' | 'NON_FUNCTIONAL'>(defaultFilter)
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
      <div className="flex flex-col items-center justify-center py-10 space-y-2 text-[var(--color-text-muted)] bg-[var(--color-bg-card)]/50">
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">Consultando base de requisitos...</span>
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
    <div className="p-4 space-y-4 bg-[var(--color-bg-secondary)]/30 rounded-xl border border-[var(--color-border)] print:bg-white print:border-none print:p-0">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 no-print">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por código, título o descripción..."
            className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] rounded-xl px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        {/* Filter buttons */}
        <div className="bg-[var(--color-surface)] p-0.5 rounded-lg flex border border-[var(--color-border-strong)] w-full sm:w-auto">
          {(['ALL', 'FUNCTIONAL', 'NON_FUNCTIONAL'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold tracking-tight uppercase transition-all ${
                filterType === type
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type === 'FUNCTIONAL' ? 'Funcional' : 'No Funcional'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List for elegant presentation */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-text-muted)] text-xs italic bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)]">
          No se encontraron requisitos que coincidan con los filtros.
        </div>
      ) : (
        <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-bg-card)] print:border-black">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border-strong)] text-[var(--color-text-secondary)] font-bold print:bg-slate-100 print:text-black print:border-black">
                <th className="p-3 w-24">Código</th>
                <th className="p-3 w-1/4">Título</th>
                <th className="p-3">Descripción</th>
                <th className="p-3 w-28 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] print:divide-slate-200">
              {filtered.map(req => (
                <tr key={req.id} className="hover:bg-[var(--color-surface)]/50 transition-colors">
                  <td className="p-3 font-mono font-black text-[var(--color-accent)] align-top print:text-black">
                    {req.code}
                  </td>
                  <td className="p-3 font-bold text-[var(--color-text-primary)] align-top print:text-black">
                    {req.title}
                  </td>
                  <td className="p-3 text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap align-top print:text-black">
                    {req.description}
                  </td>
                  <td className="p-3 text-center align-top">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      req.requirementType === 'FUNCTIONAL'
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 print:bg-transparent print:text-black'
                        : 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]/20 print:bg-transparent print:text-black'
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

function LiveDiagramPreview({ diagramId }: { diagramId: string }) {
  const [diagram, setDiagram] = useState<DiagramResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDiag = async () => {
      try {
        const data = await diagramsApi.getById(diagramId)
        setDiagram(data)
      } catch (err) {
        console.error('Error fetching diagram in Wiki:', err)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchDiag()
  }, [diagramId])

  if (isLoading) {
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)] text-xs">
        <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Generando vista previa del modelo...
      </div>
    )
  }

  if (!diagram) {
    return <div className="p-6 text-center text-[var(--color-danger)] text-xs font-bold">Error: El diagrama no pudo ser cargado.</div>
  }

  // Parse sourceJson safely
  const source = diagram.sourceJson
    ? (typeof diagram.sourceJson === 'string'
      ? (JSON.parse(diagram.sourceJson) as DiagramSourceDTO)
      : diagram.sourceJson)
    : null

  const nodes = source?.nodes || []
  const relations = source?.edges || []

  const getNodeName = (node: DiagramNodeDTO | undefined): string => {
    if (!node) return 'Sin elemento'
    return (node as any).name || (node as any).data?.name || (node as any).data?.label || 'Sin nombre'
  }

  // Visual grid bounds calculation
  const xs = nodes.map(n => n.position?.x ?? 0)
  const ys = nodes.map(n => n.position?.y ?? 0)
  const minX = xs.length > 0 ? Math.min(...xs) : 0
  const maxX = xs.length > 0 ? Math.max(...xs) : 400
  const minY = ys.length > 0 ? Math.min(...ys) : 0
  const maxY = ys.length > 0 ? Math.max(...ys) : 300
  const deltaX = (maxX - minX) || 1
  const deltaY = (maxY - minY) || 1

  const padding = 120;

  const getNodeCoords = (node: DiagramNodeDTO) => {
    const x = node.position?.x ?? 0
    const y = node.position?.y ?? 0
    const left = (x - minX) + padding
    const top = (y - minY) + padding
    return { left, top }
  }

  return (
    <div className="p-6 bg-[var(--color-bg-secondary)]/30 space-y-6 print:bg-white print:text-black print:p-0">
      
      {/* Visual Canvas Redesign */}
      <div data-diagram-id={diagramId} className="exportable-diagram-canvas relative w-full h-[500px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl overflow-auto shadow-inner print:border-black print:h-auto print:bg-slate-50 print:overflow-visible custom-scrollbar">
        <div style={{ width: Math.max(800, deltaX + padding * 2), height: Math.max(500, deltaY + padding * 2) }} className="relative mx-auto origin-top-left print:origin-top-left print:scale-[0.65] print:w-full print:h-auto">
          {/* Dot grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--color-border-strong)_1px,_transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50 print:hidden" />
          
          {/* SVG connection edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" className="fill-[var(--color-accent)] opacity-60 print:fill-black print:opacity-100" />
            </marker>
          </defs>
          {relations.map((rel: DiagramRelationDTO, index: number) => {
            const sourceNode = nodes.find((n: DiagramNodeDTO) => n.id === rel.source)
            const targetNode = nodes.find((n: DiagramNodeDTO) => n.id === rel.target)
            if (!sourceNode || !targetNode) return null

            const sourceCoords = getNodeCoords(sourceNode)
            const targetCoords = getNodeCoords(targetNode)

            return (
              <g key={rel.id || index}>
                <line
                  x1={sourceCoords.left}
                  y1={sourceCoords.top}
                  x2={targetCoords.left}
                  y2={targetCoords.top}
                  className="stroke-[var(--color-accent)] stroke-[1.5px] opacity-60 print:stroke-black print:opacity-100"
                  strokeDasharray="4 4"
                  markerEnd="url(#arrow)"
                />
              </g>
            )
          })}
        </svg>

        {/* Absolute nodes layer */}
        {nodes.length === 0 ? (
          <div className="text-center text-[var(--color-text-muted)] text-xs italic z-10">
            Sin elementos en el lienzo.
          </div>
        ) : (
          nodes.map((node: DiagramNodeDTO) => {
            const coords = getNodeCoords(node)
            const kind = (node as any)?.kind || (node as any)?.type || 'node'
            const isActor = kind === 'actor' || node.id.includes('actor')
            const isClass = kind === 'class' || (node as any)?.umlType
            const name = getNodeName(node)
            
            const data = (node as any).data || {}
            const attributes = Array.isArray(data.attributes) ? data.attributes : (Array.isArray((node as any).attributes) ? (node as any).attributes : [])
            const methods = Array.isArray(data.methods) ? data.methods : (Array.isArray((node as any).methods) ? (node as any).methods : [])
            const umlType = data.umlType || (node as any).umlType || 'CLASS'

            // Función de ayuda para visibilidad
            const formatVis = (v: string) => v === 'private' ? '-' : v === 'protected' ? '#' : v === 'package' ? '~' : '+'

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${coords.left}px`,
                  top: `${coords.top}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`transition-all select-none print:bg-white print:border-black print:text-black z-20 ${
                  isActor ? 'flex flex-col items-center gap-1' : 'min-w-[150px] rounded-xl border border-[var(--color-border-strong)] shadow-lg text-left'
                } ${
                  isActor ? '' : 'bg-[var(--color-bg-card)]'
                }`}
              >
                {isActor ? (
                  // DIBUJO DE ACTOR COMPLETO
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-subtle)] flex items-center justify-center shadow-lg print:border-black print:bg-white text-2xl">
                      👤
                    </div>
                    <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] print:text-black bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)] print:bg-transparent print:border-none">
                      {name}
                    </span>
                  </div>
                ) : (
                  // DIBUJO DE CLASE COMPLETA
                  <div className="flex flex-col w-full text-[var(--color-text-primary)]">
                    {/* Header */}
                    <header className={`border-b border-[var(--color-border-strong)] ${isClass ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-bg-secondary)]'} px-3 py-2 text-center rounded-t-xl print:border-black print:bg-slate-100 print:text-black`}>
                      {isClass && umlType !== 'CLASS' && (
                        <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-0.5">
                          {`<<${umlType.toLowerCase()}>>`}
                        </p>
                      )}
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-[var(--color-text-primary)]">
                        {!isClass && <span className="text-sm">⚙️</span>}
                        {name}
                      </h3>
                    </header>
                    
                    {/* Attributes and Methods only shown if it's a class or has attributes */}
                    {(isClass || attributes.length > 0 || methods.length > 0) && (
                      <>
                        <section className="border-b border-[var(--color-border-strong)] px-3 py-2 min-h-[24px] print:border-black print:text-black bg-[var(--color-bg-card)]">
                          {attributes.length === 0 ? (
                            <div className="h-2"></div>
                          ) : (
                            attributes.map((attr: any, i: number) => (
                              <div key={i} className="text-[9px] font-mono leading-tight">
                                <span className="text-[var(--color-accent)] font-bold mr-1">{formatVis(attr.visibility)}</span>
                                <span className="font-bold text-[var(--color-text-primary)]">{attr.name}</span>
                                <span className="text-[var(--color-text-muted)]">: {attr.type || 'String'}</span>
                              </div>
                            ))
                          )}
                        </section>
                        
                        <section className="px-3 py-2 min-h-[24px] print:text-black bg-[var(--color-bg-card)] rounded-b-xl">
                          {methods.length === 0 ? (
                            <div className="h-2"></div>
                          ) : (
                            methods.map((meth: any, i: number) => (
                              <div key={i} className="text-[9px] font-mono leading-tight truncate max-w-[180px]">
                                <span className="text-[var(--color-success)] font-bold mr-1">{formatVis(meth.visibility)}</span>
                                <span className="font-bold text-[var(--color-text-primary)]">{meth.name}()</span>
                                <span className="text-[var(--color-text-muted)]">: {meth.returnType || 'void'}</span>
                              </div>
                            ))
                          )}
                        </section>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
        </div>
      </div>

      {/* Detail Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nodes section */}
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-card)] print:border-black">
          <h4 className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-3 print:text-black">Elementos del Modelo ({nodes.length})</h4>
          <div className="flex flex-wrap gap-2">
            {nodes.length === 0 ? (
              <span className="text-xs text-[var(--color-text-muted)] italic">Sin elementos en el lienzo.</span>
            ) : (
              nodes.map((node: DiagramNodeDTO) => {
                const kind = (node as any)?.kind || 'node'
                const isActor = kind === 'actor' || node.id.includes('actor')
                return (
                  <span
                    key={node.id}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                      isActor
                        ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning)]/20 print:text-black print:border-black'
                        : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 print:text-black print:border-black'
                    }`}
                  >
                    <span>{isActor ? '👤' : '⚙️'}</span>
                    {getNodeName(node)}
                  </span>
                )
              })
            )}
          </div>
        </div>

        {/* Relations section */}
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-card)] print:border-black">
          <h4 className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-3 print:text-black">Relaciones de Diseño ({relations.length})</h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
            {relations.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic">Sin relaciones mapeadas en el lienzo.</p>
            ) : (
              relations.map((rel: DiagramRelationDTO, index: number) => {
                const sourceNode = nodes.find((n: DiagramNodeDTO) => n.id === rel.source)
                const targetNode = nodes.find((n: DiagramNodeDTO) => n.id === rel.target)
                const sourceName = getNodeName(sourceNode)
                const targetName = getNodeName(targetNode)
                return (
                  <div key={index} className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2 print:text-black">
                    <span className="font-bold text-[var(--color-text-primary)] print:text-black">{sourceName}</span>
                    <span className="text-[var(--color-accent)] font-bold print:text-black">→</span>
                    <span className="font-medium text-[var(--color-text-muted)] print:text-black">{targetName}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

