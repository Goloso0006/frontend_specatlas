import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsApi, exportApi } from '../api/services/projectsApi'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Command palette state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [projectDiagrams, setProjectDiagrams] = useState<DiagramSummaryResponse[]>([])
  const [isLoadingDiagrams, setIsLoadingDiagrams] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [emptyFolders, setEmptyFolders] = useState<string[]>(() => {
    if (!projectId) return []
    const stored = localStorage.getItem(`specatlas_empty_folders_${projectId}`)
    return stored ? JSON.parse(stored) : []
  })
  const [moveConfirm, setMoveConfirm] = useState<{
    reportId: string;
    reportTitle: string;
    targetFolder: string | null;
  } | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState<{
    reportId: string;
    fullTitle: string;
  } | null>(null)

  const [activeMenu, setActiveMenu] = useState<{
    type: 'folder' | 'document';
    id: string;
  } | null>(null)

  const [renameModal, setRenameModal] = useState<{
    type: 'folder' | 'document';
    id: string;
    currentTitle: string;
  } | null>(null)
  const [renameInputValue, setRenameInputValue] = useState('')

  const [folderMoveConfirm, setFolderMoveConfirm] = useState<{
    sourceFolder: string;
    targetFolder: string;
  } | null>(null)

  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{
    folderName: string;
    docCount: number;
  } | null>(null)

  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`specatlas_empty_folders_${projectId}`, JSON.stringify(emptyFolders))
    }
  }, [emptyFolders, projectId])

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: prev[folderName] === false ? true : false
    }))
  }

  const handleCreateEmptyFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const folder = newFolderName.trim()
    if (!folder) return
    if (folder.length > 30) return

    // Check if folder name already exists in reports or empty folders
    const existsInReports = reports.some(r => r.title.split('/')[0].trim().toLowerCase() === folder.toLowerCase())
    const existsInEmpty = emptyFolders.some(f => f.toLowerCase() === folder.toLowerCase())

    if (existsInReports || existsInEmpty) {
      alert('Esta carpeta ya existe.')
      return
    }

    setEmptyFolders(prev => [...prev, folder])
    setIsFolderModalOpen(false)
    setNewFolderName('')
    setIsSidebarOpen(true)
    setExpandedFolders(prev => ({ ...prev, [folder]: true }))
  }

  const handleMoveReportToFolder = async (reportId: string, targetFolder: string | null) => {
    const report = reports.find(r => r.id === reportId)
    if (!report) return

    // Calculate new title
    let newTitle = ''
    // Get the bare document name (last segment after all folder prefixes)
    const bareTitle = report.title.includes('/') 
      ? report.title.split('/').pop()!.trim()
      : report.title.trim()
    
    if (targetFolder) {
      newTitle = `${targetFolder} / ${bareTitle}`
    } else {
      // Remove ALL folder prefixes
      newTitle = bareTitle
    }

    try {
      setIsLoading(true)
      const updated = await projectsApi.updateReport(projectId || '', reportId, {
        title: newTitle,
        content: report.content
      })
      
      // Update local state
      setReports(prev => prev.map(r => r.id === reportId ? updated : r))
      
      // If currently selected, update title and state
      if (selectedReport?.id === reportId) {
        setSelectedReport(updated)
        setTitle(updated.title)
      }
      
      // Remove folder from empty folders list if it was empty and now has a document
      if (targetFolder) {
        setEmptyFolders(prev => prev.filter(f => f !== targetFolder))
      }
    } catch (err) {
      console.error('Error al mover reporte:', err)
    } finally {
      setIsLoading(false)
      setMoveConfirm(null)
    }
  }

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
      setIsSidebarOpen(true)
      handleSelectReport(newReport)
    } catch (err) {
      console.error('Error al crear reporte:', err)
    }
  }

  const handleCreateReportInFolder = async (folderName: string) => {
    if (!projectId) return
    try {
      const newReport = await projectsApi.createReport(projectId, {
        title: `${folderName} / Nuevo Documento`,
        content: '# Título del Documento\n\nEscribe aquí el contenido del documento.\n\nEscribe /// para abrir la paleta de comandos.'
      })
      setReports(prev => [newReport, ...prev])
      setIsSidebarOpen(true)
      // Expand all parent folder segments
      const segments = folderName.split(' / ')
      const expandUpdates: Record<string, boolean> = {}
      let path = ''
      segments.forEach((seg, i) => {
        path = i === 0 ? seg : `${path} / ${seg}`
        expandUpdates[path] = true
      })
      setExpandedFolders(prev => ({ ...prev, ...expandUpdates }))
      // Remove from empty folders since it now has a document
      setEmptyFolders(prev => prev.filter(f => f !== folderName))
      handleSelectReport(newReport)
    } catch (err) {
      console.error('Error al crear reporte en carpeta:', err)
    }
  }

  const handleMoveFolderIntoFolder = async (sourceFolder: string, targetFolder: string) => {
    if (!projectId || sourceFolder === targetFolder) return
    try {
      setIsLoading(true)

      // Check if source folder has documents
      const sourceDocs = reports.filter(r => r.title.startsWith(`${sourceFolder} /`))

      // Rename documents: "sourceFolder / doc" → "targetFolder / sourceFolder / doc"
      const updatedList = await Promise.all(
        reports.map(async (r) => {
          if (r.title.startsWith(`${sourceFolder} /`)) {
            const cleanName = r.title.split('/').slice(1).join('/').trim()
            const updated = await projectsApi.updateReport(projectId, r.id, {
              title: `${targetFolder} / ${sourceFolder} / ${cleanName}`,
              content: r.content
            })
            return updated
          }
          return r
        })
      )
      setReports(updatedList)

      // Remove source from top-level emptyFolders
      setEmptyFolders(prev => {
        const next = prev.filter(f => f !== sourceFolder)
        // Add nested sub-folder path so it persists in sidebar
        const nestedPath = `${targetFolder} / ${sourceFolder}`
        if (!next.includes(nestedPath) && sourceDocs.length === 0) {
          next.push(nestedPath)
        }
        return next
      })

      // Update selected report if it was in the moved folder
      const currentSelected = updatedList.find(r => r.id === selectedReport?.id)
      if (currentSelected) {
        setSelectedReport(currentSelected)
        setTitle(currentSelected.title)
      }

      // Expand target folder
      setExpandedFolders(prev => ({ ...prev, [targetFolder]: true }))
    } catch (err) {
      console.error('Error al mover carpeta:', err)
    } finally {
      setIsLoading(false)
      setFolderMoveConfirm(null)
    }
  }

  const handleExtractFolderToRoot = async (nestedFolderPath: string) => {
    if (!projectId) return
    // nestedFolderPath is like "saludo / hola"
    const parts = nestedFolderPath.split(' / ')
    const folderName = parts[parts.length - 1] // "hola"
    
    try {
      setIsLoading(true)

      // Rename all documents: "saludo / hola / doc" → "hola / doc"
      const updatedList = await Promise.all(
        reports.map(async (r) => {
          if (r.title.startsWith(`${nestedFolderPath} /`)) {
            const cleanName = r.title.substring(nestedFolderPath.length + 3).trim()
            const updated = await projectsApi.updateReport(projectId, r.id, {
              title: `${folderName} / ${cleanName}`,
              content: r.content
            })
            return updated
          }
          return r
        })
      )
      setReports(updatedList)

      // Update emptyFolders: remove nested path, add root-level name
      setEmptyFolders(prev => {
        const next = prev.filter(f => f !== nestedFolderPath)
        if (!next.includes(folderName)) {
          next.push(folderName)
        }
        return next
      })

      // Update selected if affected
      const currentSelected = updatedList.find(r => r.id === selectedReport?.id)
      if (currentSelected) {
        setSelectedReport(currentSelected)
        setTitle(currentSelected.title)
      }

      setExpandedFolders(prev => ({ ...prev, [folderName]: true }))
    } catch (err) {
      console.error('Error al extraer carpeta:', err)
    } finally {
      setIsLoading(false)
      setFolderMoveConfirm(null)
    }
  }



  const handleSelectReport = (report: ProjectReport) => {
    setSelectedReport(report)
    setTitle(report.title)
    setContent(report.content)
    setIsEditing(true)
    setActiveTab('edit')

    // Auto-expand folder if it has one
    if (report.title.includes('/')) {
      const folderName = report.title.split('/')[0].trim()
      setExpandedFolders(prev => ({
        ...prev,
        [folderName]: true
      }))
    }
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

  const handleDeleteReportRequest = (reportId: string, fullTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm({ reportId, fullTitle })
  }

  const handleConfirmDelete = async () => {
    if (!projectId || !deleteConfirm) return
    const { reportId } = deleteConfirm
    try {
      await projectsApi.deleteReport(projectId, reportId)
      setReports(prev => prev.filter(r => r.id !== reportId))
      if (selectedReport?.id === reportId) {
        setIsEditing(false)
        setSelectedReport(null)
      }
    } catch (err) {
      console.error('Error al eliminar reporte:', err)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleConfirmDeleteFolder = async () => {
    if (!deleteFolderConfirm) return
    const { folderName } = deleteFolderConfirm

    try {
      // Get all documents in this folder (including subfolders)
      const docsToDelete = reports.filter(r => {
        const cleanTitle = r.title.split('/')[0].trim()
        return cleanTitle === folderName
      })

      // Delete all documents in this folder
      for (const doc of docsToDelete) {
        if (projectId) {
          await projectsApi.deleteReport(projectId, doc.id)
        }
      }

      // Remove the folder from emptyFolders
      setEmptyFolders(prev => prev.filter(f => !f.startsWith(folderName)))
      
      // Update reports list
      setReports(prev => prev.filter(r => {
        const cleanTitle = r.title.split('/')[0].trim()
        return cleanTitle !== folderName
      }))

      // Clear selection if the deleted folder's document is selected
      if (selectedReport) {
        const selectedCleanTitle = selectedReport.title.split('/')[0].trim()
        if (selectedCleanTitle === folderName) {
          setIsEditing(false)
          setSelectedReport(null)
        }
      }
    } catch (err) {
      console.error('Error al eliminar carpeta:', err)
    } finally {
      setDeleteFolderConfirm(null)
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
  const handleExportPDF = async () => {
    if (!selectedReport || !projectId) return

    try {
      // Extraer tabla de requisitos si existe
      const tableHeaders = ['Código', 'Título', 'Descripción', 'Tipo']
      const tableRows: (string | number)[][] = []

      // Si el contenido incluye requisitos, agregar datos de la tabla
      if (content.includes('{{REQUISITOS_TABLA}}')) {
        try {
          const reqs = await requirementsApi.getByProject(projectId)
          reqs.forEach(req => {
            tableRows.push([
              req.code,
              req.title,
              req.description,
              req.requirementType === 'FUNCTIONAL' ? 'Funcional' : 'No Funcional'
            ])
          })
        } catch (err) {
          console.warn('No se pudieron cargar los requisitos:', err)
        }
      }

      // Generar PDF local
      await exportApi.exportToPDFLocal(title, content, tableRows.length > 0 ? tableHeaders : undefined, tableRows.length > 0 ? tableRows : undefined)
    } catch (err) {
      console.error('Error exportando a PDF:', err)
      alert('Error al exportar a PDF. Intenta de nuevo.')
    }
  }

  const handleExportGoogleDocs = async () => {
    if (!selectedReport || !projectId) return

    try {
      // Extraer tabla de requisitos si existe
      const tableHeaders = ['Código', 'Título', 'Descripción', 'Tipo']
      const tableRows: (string | number)[][] = []

      // Si el contenido incluye requisitos, agregar datos de la tabla
      if (content.includes('{{REQUISITOS_TABLA}}')) {
        try {
          const reqs = await requirementsApi.getByProject(projectId)
          reqs.forEach(req => {
            tableRows.push([
              req.code,
              req.title,
              req.description,
              req.requirementType === 'FUNCTIONAL' ? 'Funcional' : 'No Funcional'
            ])
          })
        } catch (err) {
          console.warn('No se pudieron cargar los requisitos:', err)
        }
      }

      const result = await exportApi.exportToGoogleDocs({
        title,
        content,
        tableHeaders: tableRows.length > 0 ? tableHeaders : undefined,
        tableRows: tableRows.length > 0 ? tableRows : undefined,
      })

      // Abre el documento en Google Docs en nueva pestaña
      window.open(result.documentLink, '_blank')
    } catch (err) {
      console.error('Error exportando a Google Docs:', err)
      alert('Error al exportar a Google Docs. Intenta de nuevo.')
    }
  }

  const handleExportWord = async () => {
    if (!selectedReport) return
    
    const wasEdit = activeTab === 'edit'
    if (wasEdit) {
      setActiveTab('preview')
      // Wait for layout to update so html2canvas can read dimensions
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    try {
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
    } finally {
      if (wasEdit) {
        setActiveTab('edit')
      }
    }
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

      {/* Sidebar Toggle Button — visible when sidebar is collapsed */}
      {!isSidebarOpen && (
        <div className="flex flex-col items-center pt-4 pb-2 px-1.5 border-r border-[var(--color-border)] bg-[var(--color-bg-card)] no-print shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] text-[var(--color-accent)] transition-all shadow-sm cursor-pointer group"
            title="Abrir panel de documentos"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className="transition-transform group-hover:translate-x-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          <span className="text-[8px] font-bold text-[var(--color-text-muted)] mt-1.5 uppercase tracking-wider writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Wiki</span>
        </div>
      )}

      {/* Sidebar List */}
      <div
        className={`border-r border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col flex-shrink-0 no-print transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between min-w-[320px]">
          <h2 className="text-sm font-black tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="text-[var(--color-accent)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Wiki del Proyecto
          </h2>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="p-1.5 px-3 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>+</span> New
            </button>

            {isNewMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNewMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false)
                      void handleCreateReport()
                    }}
                    className="w-full text-left p-2 px-3 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] text-xs font-semibold flex items-center gap-2 text-[var(--color-text-secondary)] transition-all"
                  >
                    <span>📝</span> Crear Documento
                  </button>
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false)
                      setIsFolderModalOpen(true)
                      setNewFolderName('')
                    }}
                    className="w-full text-left p-2 px-3 rounded-xl hover:bg-[var(--color-success-subtle)] hover:text-emerald-400 text-xs font-semibold flex items-center gap-2 text-[var(--color-text-secondary)] transition-all"
                  >
                    <span>📁</span> Crear Carpeta
                  </button>
                </div>
              </>
            )}
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
              title="Ocultar panel"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-[var(--color-text-muted)]">
              <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px]">Cargando reportes...</span>
            </div>
          ) : reports.length === 0 && emptyFolders.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)] space-y-1">
              <span className="text-2xl block">📁</span>
              <p className="text-[11px]">No hay documentos creados aún.</p>
            </div>
          ) : (() => {
            // Group reports by virtual folder
            const foldersMap: Record<string, ProjectReport[]> = {}
            const rootReports: ProjectReport[] = []

            // Initialize top-level empty folders in map
            emptyFolders.forEach(folder => {
              if (!folder.includes(' / ')) {
                if (!foldersMap[folder]) foldersMap[folder] = []
              } else {
                // Nested empty folder like "saludo / hola": ensure parent exists
                const parent = folder.split(' / ')[0].trim()
                if (!foldersMap[parent]) foldersMap[parent] = []
              }
            })

            reports.forEach(report => {
              if (report.title.includes('/')) {
                const parts = report.title.split('/')
                const folderName = parts[0].trim()
                if (!foldersMap[folderName]) {
                  foldersMap[folderName] = []
                }
                foldersMap[folderName].push(report)
              } else {
                rootReports.push(report)
              }
            })

            return (
              <div className="space-y-3">
                {/* Virtual Folders */}
                {Object.keys(foldersMap).sort().map(folderName => (
                  <div key={folderName} className="space-y-1">
                    <div 
                      onClick={() => toggleFolder(folderName)}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', `folder:${folderName}`)
                        e.currentTarget.classList.add('opacity-40')
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-40')
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.add('bg-[var(--color-accent-subtle)]')
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-[var(--color-accent-subtle)]')
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        e.currentTarget.classList.remove('bg-[var(--color-accent-subtle)]')
                        const dragData = e.dataTransfer.getData('text/plain')

                        if (dragData.startsWith('folder:')) {
                          const sourceFolder = dragData.replace('folder:', '')
                          // Ignore drops of own sub-folders (they're already inside this folder)
                          if (sourceFolder !== folderName && !sourceFolder.startsWith(`${folderName} / `)) {
                            setFolderMoveConfirm({ sourceFolder, targetFolder: folderName })
                          }
                        } else {
                          const reportId = dragData
                          const targetReport = reports.find(r => r.id === reportId)
                          if (targetReport) {
                            setMoveConfirm({
                              reportId,
                              reportTitle: targetReport.title,
                              targetFolder: folderName
                            })
                          }
                        }
                      }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-surface)] cursor-pointer text-xs font-bold text-[var(--color-text-secondary)] transition-all select-none border border-transparent"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{expandedFolders[folderName] !== false ? '📂' : '📁'}</span>
                        <span className="truncate">{folderName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono bg-[var(--color-surface)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                          {foldersMap[folderName].length}
                        </span>
                        <div className="relative shrink-0 flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenu(prev => prev?.type === 'folder' && prev.id === folderName ? null : { type: 'folder', id: folderName })
                            }}
                            className="p-1 hover:bg-[var(--color-surface)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer text-[10px]"
                            title="Opciones de carpeta"
                          >
                            ⋮
                          </button>
                          
                          {activeMenu?.type === 'folder' && activeMenu.id === folderName && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                              <div className="absolute right-0 mt-8 w-36 bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-2xl shadow-xl z-45 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenu(null)
                                    setRenameModal({ type: 'folder', id: folderName, currentTitle: folderName })
                                    setRenameInputValue(folderName)
                                  }}
                                  className="w-full text-left p-2 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] text-[11px] font-bold flex items-center gap-1.5 text-[var(--color-text-secondary)] transition-all cursor-pointer"
                                >
                                  ✏️ Editar Nombre
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenu(null)
                                    void handleCreateReportInFolder(folderName)
                                  }}
                                  className="w-full text-left p-2 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] text-[11px] font-bold flex items-center gap-1.5 text-[var(--color-text-secondary)] transition-all cursor-pointer"
                                >
                                  📝 Crear Documento
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenu(null)
                                    setDeleteFolderConfirm({ folderName, docCount: foldersMap[folderName].length })
                                  }}
                                  className="w-full text-left p-2 rounded-xl hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] text-[11px] font-bold flex items-center gap-1.5 text-[var(--color-text-secondary)] transition-all cursor-pointer"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Folder content */}
                    {expandedFolders[folderName] !== false && (
                      <div className="pl-3.5 space-y-1.5 border-l border-[var(--color-border)] ml-3.5 py-1">
                        {/* Nested sub-folders */}
                        {(() => {
                          // Find nested empty sub-folders for this parent
                          const nestedSubFolders = emptyFolders
                            .filter(f => f.startsWith(`${folderName} / `))
                            .map(f => f.substring(folderName.length + 3).trim())
                          
                          // Find sub-folders from documents with 3+ level paths
                          const docSubFolders = new Set<string>()
                          foldersMap[folderName].forEach(report => {
                            const cleanTitle = report.title.split('/').slice(1).join('/').trim()
                            if (cleanTitle.includes('/')) {
                              docSubFolders.add(cleanTitle.split('/')[0].trim())
                            }
                          })

                          // Merge sub-folder names
                          const allSubFolders = Array.from(new Set([...nestedSubFolders, ...Array.from(docSubFolders)])).sort()

                          return allSubFolders.map(subName => {
                            const subKey = `${folderName} / ${subName}`
                            const subDocs = foldersMap[folderName].filter(r => {
                              const cleanTitle = r.title.split('/').slice(1).join('/').trim()
                              return cleanTitle.startsWith(`${subName} /`)
                            })

                            return (
                              <div key={subKey} className="space-y-1">
                                <div
                                  onClick={() => toggleFolder(subKey)}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.stopPropagation()
                                    e.dataTransfer.setData('text/plain', `folder:${subKey}`)
                                    e.currentTarget.classList.add('opacity-40')
                                  }}
                                  onDragEnd={(e) => {
                                    e.currentTarget.classList.remove('opacity-40')
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.currentTarget.classList.add('bg-[var(--color-accent-subtle)]')
                                  }}
                                  onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('bg-[var(--color-accent-subtle)]')
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.currentTarget.classList.remove('bg-[var(--color-accent-subtle)]')
                                    const dragData = e.dataTransfer.getData('text/plain')
                                    if (dragData.startsWith('folder:')) return
                                    const reportId = dragData
                                    const targetReport = reports.find(r => r.id === reportId)
                                    if (targetReport) {
                                      setMoveConfirm({
                                        reportId,
                                        reportTitle: targetReport.title,
                                        targetFolder: subKey
                                      })
                                    }
                                  }}
                                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[var(--color-surface)] cursor-pointer text-[11px] font-bold text-[var(--color-text-muted)] transition-all select-none border border-transparent"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs">{expandedFolders[subKey] !== false ? '📂' : '📁'}</span>
                                    <span className="truncate">{subName}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-[var(--color-text-muted)] font-mono bg-[var(--color-surface)] px-1 py-0.5 rounded border border-[var(--color-border)]">
                                      {subDocs.length}
                                    </span>
                                    <div className="relative shrink-0 flex items-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveMenu(prev => prev?.type === 'folder' && prev.id === subKey ? null : { type: 'folder', id: subKey })
                                        }}
                                        className="p-0.5 hover:bg-[var(--color-surface)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer text-[10px]"
                                        title="Opciones de sub-carpeta"
                                      >
                                        ⋮
                                      </button>

                                      {activeMenu?.type === 'folder' && activeMenu.id === subKey && (
                                        <>
                                          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                                          <div className="absolute right-0 mt-8 w-36 bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-2xl shadow-xl z-45 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setActiveMenu(null)
                                                void handleCreateReportInFolder(subKey)
                                              }}
                                              className="w-full text-left p-2 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] text-[11px] font-bold flex items-center gap-1.5 text-[var(--color-text-secondary)] transition-all cursor-pointer"
                                            >
                                              📝 Crear Documento
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setActiveMenu(null)
                                                setFolderMoveConfirm({ sourceFolder: subKey, targetFolder: '__ROOT__' })
                                              }}
                                              className="w-full text-left p-2 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] text-[11px] font-bold flex items-center gap-1.5 text-[var(--color-text-secondary)] transition-all cursor-pointer"
                                            >
                                              📤 Sacar de Carpeta
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setActiveMenu(null)
                                                setDeleteFolderConfirm({ folderName: subKey, docCount: subDocs.length })
                                              }}
                                              className="w-full text-left p-2 rounded-xl hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] text-[11px] font-bold flex items-center gap-1.5 text-[var(--color-text-secondary)] transition-all cursor-pointer"
                                            >
                                              🗑️ Eliminar
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {expandedFolders[subKey] !== false && subDocs.length > 0 && (
                                  <div className="pl-3 space-y-1 border-l border-[var(--color-border)]/50 ml-2.5">
                                    {subDocs.map(report => {
                                      const subCleanTitle = report.title.split('/').slice(2).join('/').trim() || report.title
                                      return (
                                        <div
                                          key={report.id}
                                          onClick={() => handleSelectReport(report)}
                                          draggable={true}
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', report.id)
                                            e.currentTarget.classList.add('opacity-40')
                                          }}
                                          onDragEnd={(e) => {
                                            e.currentTarget.classList.remove('opacity-40')
                                          }}
                                          className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 group relative overflow-visible ${
                                            selectedReport?.id === report.id
                                              ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)]'
                                              : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                                          }`}
                                        >
                                          <h3 className="font-bold text-[11px] text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                                            📄 {subCleanTitle}
                                          </h3>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        })()}

                        {/* Direct documents (no sub-folder) */}
                        {foldersMap[folderName].filter(r => {
                          const cleanTitle = r.title.split('/').slice(1).join('/').trim()
                          return !cleanTitle.includes('/')
                        }).map(report => {
                          const parts = report.title.split('/')
                          const cleanTitle = parts.slice(1).join('/').trim() || report.title

                          return (
                            <div
                              key={report.id}
                              onClick={() => handleSelectReport(report)}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', report.id)
                                e.currentTarget.classList.add('opacity-40')
                              }}
                              onDragEnd={(e) => {
                                e.currentTarget.classList.remove('opacity-40')
                              }}
                              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group relative overflow-visible ${
                                selectedReport?.id === report.id
                                  ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)]'
                                  : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                              }`}
                            >
                              <h3 className="font-bold text-xs text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                                📄 {cleanTitle}
                              </h3>
                              <div className="relative shrink-0 flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenu(prev => prev?.type === 'document' && prev.id === report.id ? null : { type: 'document', id: report.id })
                                  }}
                                  className="p-1 hover:bg-[var(--color-surface)]/20 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all opacity-0 group-hover:opacity-100 cursor-pointer text-[10px]"
                                  title="Opciones de documento"
                                >
                                  ⋮
                                </button>
                                
                                {activeMenu?.type === 'document' && activeMenu.id === report.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-lg shadow-lg z-[100] p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveMenu(null)
                                          const cleanTitle = report.title.includes('/') ? report.title.split('/').slice(1).join('/').trim() : report.title.trim()
                                          setRenameModal({ type: 'document', id: report.id, currentTitle: report.title })
                                          setRenameInputValue(cleanTitle)
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] text-xs font-semibold flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                                      >
                                        ✏️ Editar Nombre
                                      </button>
                                      <div className="h-px bg-[var(--color-border)]/30" />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveMenu(null)
                                          handleDeleteReportRequest(report.id, report.title, e)
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] text-xs font-semibold flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                                      >
                                        🗑️ Eliminar
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Root Reports / Drop Zone to remove from folders */}
                <div 
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('bg-[var(--color-accent-subtle)]/30')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('bg-[var(--color-accent-subtle)]/30')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('bg-[var(--color-accent-subtle)]/30')
                      const dragData = e.dataTransfer.getData('text/plain')
                      if (dragData.startsWith('folder:')) {
                        // Handle extracting a nested folder to root
                        const folderPath = dragData.replace('folder:', '')
                        if (folderPath.includes(' / ')) {
                          setFolderMoveConfirm({ sourceFolder: folderPath, targetFolder: '__ROOT__' })
                        }
                        return
                      }
                      const reportId = dragData
                      const targetReport = reports.find(r => r.id === reportId)
                      if (targetReport && targetReport.title.includes('/')) {
                        setMoveConfirm({
                          reportId,
                          reportTitle: targetReport.title,
                          targetFolder: null
                        })
                      }
                    }}
                    className="space-y-1.5 pt-3 mt-2 border-2 border-dashed border-[var(--color-border)] rounded-xl transition-all min-h-[50px] px-2 pb-2"
                  >
                    <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-1 mb-1 flex items-center justify-between">
                      <span>📥 Documentos Libres</span>
                      <span className="text-[8px] font-normal text-[var(--color-text-muted)] lowercase">(arrastra aquí para liberar)</span>
                    </div>
                    {rootReports.map(report => (
                      <div
                        key={report.id}
                        onClick={() => handleSelectReport(report)}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', report.id)
                          e.currentTarget.classList.add('opacity-40')
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.classList.remove('opacity-40')
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group relative overflow-visible ${
                          selectedReport?.id === report.id
                            ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)]'
                            : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                        }`}
                      >
                        <h3 className="font-bold text-xs text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                          📄 {report.title}
                        </h3>
                        <div className="relative shrink-0 flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenu(prev => prev?.type === 'document' && prev.id === report.id ? null : { type: 'document', id: report.id })
                            }}
                            className="p-1 hover:bg-[var(--color-surface)]/20 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all opacity-0 group-hover:opacity-100 cursor-pointer text-[10px]"
                            title="Opciones de documento"
                          >
                            ⋮
                          </button>
                          
                          {activeMenu?.type === 'document' && activeMenu.id === report.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                              <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-lg shadow-lg z-[100] p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenu(null)
                                    const cleanTitle = report.title.includes('/') ? report.title.split('/').slice(1).join('/').trim() : report.title.trim()
                                    setRenameModal({ type: 'document', id: report.id, currentTitle: report.title })
                                    setRenameInputValue(cleanTitle)
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] text-xs font-semibold flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                                >
                                  ✏️ Editar Nombre
                                </button>
                                <div className="h-px bg-[var(--color-border)]/30" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenu(null)
                                    handleDeleteReportRequest(report.id, report.title, e)
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] text-xs font-semibold flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )
          })()}
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
                    if (val === 'docs') handleExportGoogleDocs();
                    e.target.value = '';
                  }}
                  className="p-1.5 pl-3 pr-8 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] font-bold text-xs transition-all cursor-pointer outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="" disabled hidden>📤 Exportar</option>
                  <option value="pdf">📄 PDF Local</option>
                  <option value="word">📝 Word</option>
                  <option value="docs">📘 Google Docs</option>
                </select>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    if (selectedReport) {
                      handleDeleteReportRequest(selectedReport.id, selectedReport.title, e)
                    }
                  }}
                  className="p-1.5 px-3 rounded-lg bg-[var(--color-danger-subtle)] hover:bg-[var(--color-danger)] text-[var(--color-danger)] hover:text-white border border-[var(--color-danger)]/30 hover:border-[var(--color-danger)] font-bold text-xs transition-all cursor-pointer"
                  title="Eliminar documento permanentemente"
                >
                  🗑️ Eliminar
                </button>

              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative print-content">
              {/* EDIT TAB */}
              <div className={`h-full flex flex-col no-print ${activeTab === 'edit' ? 'flex' : 'hidden'}`}>
                {/* Rich Editing Bar */}
                <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1.5 rich-bar overflow-x-auto">
                    {/* Heading Buttons */}
                    <button
                      onClick={() => insertTagAtCursor('\n# ')}
                      className="p-1.5 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)]/50 font-black text-[11px] flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                      title="Título Principal (H1)"
                    >
                      H1
                    </button>
                    <button
                      onClick={() => insertTagAtCursor('\n## ')}
                      className="p-1.5 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)]/50 font-bold text-[10px] flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                      title="Subtítulo (H2)"
                    >
                      H2
                    </button>
                    <button
                      onClick={() => insertTagAtCursor('\n### ')}
                      className="p-1.5 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)]/50 font-semibold text-[10px] flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                      title="Encabezado Pequeño (H3)"
                    >
                      H3
                    </button>

                    <div className="h-4 w-px bg-[var(--color-border)] shrink-0" />

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

              {/* PREVIEW TAB */}
              <div className={`h-full overflow-y-auto p-8 leading-relaxed custom-scrollbar bg-[var(--color-bg)] print:bg-white print:text-black print:p-0 ${activeTab === 'preview' ? 'block' : 'hidden print:block'}`}>
                <div className="max-w-4xl mx-auto space-y-6 print:max-w-full">
                  <h1 className="text-2xl font-black text-[var(--color-text-primary)] pb-3 border-b border-[var(--color-border)] print:text-black print:border-black">
                    {title}
                  </h1>
                  <LiveDocumentRenderer
                    content={content}
                    projectId={projectId || ''}
                    reports={reports}
                    onSelectReport={(targetId) => {
                      const found = reports.find(r => r.id === targetId)
                      if (found) handleSelectReport(found)
                    }}
                  />
                </div>
              </div>
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

            <div className="space-y-2 pt-2 border-t border-[var(--color-border)]/50">
              <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wide">Enlazar a Documento de la Wiki</p>
              {reports.filter(r => r.id !== selectedReport?.id).length === 0 ? (
                <div className="text-center py-2 text-[10px] text-[var(--color-text-muted)]">No hay otros documentos para enlazar.</div>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {reports.filter(r => r.id !== selectedReport?.id).map(r => (
                    <button
                      key={r.id}
                      onClick={() => insertTagAtCursor(`[🔗 ${r.title}](wiki://${r.id})`)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] border border-transparent hover:border-[var(--color-accent)]/20 text-xs font-bold transition-all flex items-center justify-between text-[var(--color-text-secondary)]"
                    >
                      <span className="truncate">🔗 {r.title}</span>
                      <span className="text-[9px] font-mono text-[var(--color-text-muted)]">wiki://</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Move Confirmation Modal */}
      {moveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
              <span>🔀</span> Confirmar Movimiento de Documento
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              ¿Estás seguro de que deseas mover el documento <strong className="text-[var(--color-text-primary)]">"{moveConfirm.reportTitle.includes('/') ? moveConfirm.reportTitle.split('/').slice(1).join('/').trim() : moveConfirm.reportTitle}"</strong> a{' '}
              {moveConfirm.targetFolder ? (
                <span>
                  la carpeta <strong className="text-emerald-400">"{moveConfirm.targetFolder}"</strong>?
                </span>
              ) : (
                <span>la sección de <strong className="text-[var(--color-accent)]">Documentos Libres</strong> (raíz)?</span>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/50">
              <button
                onClick={() => setMoveConfirm(null)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleMoveReportToFolder(moveConfirm.reportId, moveConfirm.targetFolder)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Creation Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <form onSubmit={handleCreateEmptyFolderSubmit} className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                <span>📁</span> Crear Nueva Carpeta Virtual
              </h3>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 hover:bg-[var(--color-surface)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-wider">
                Nombre de la Carpeta
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value.substring(0, 30))}
                placeholder="Ej. Requisitos, Arquitectura, Pruebas..."
                maxLength={30}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
              />
              <div className="flex justify-between items-center text-[10px] text-[var(--color-text-muted)] mt-1">
                <span>Máximo 30 caracteres</span>
                <span className={newFolderName.length === 30 ? "text-[var(--color-danger)] font-bold" : ""}>
                  {newFolderName.length} / 30
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/50">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Crear Carpeta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <form 
            onSubmit={async (e) => {
              e.preventDefault()
              const value = renameInputValue.trim()
              if (!value) return

              try {
                if (renameModal.type === 'document') {
                  const report = reports.find(r => r.id === renameModal.id)
                  if (report) {
                    let newTitle = ''
                    if (report.title.includes('/')) {
                      const parts = report.title.split('/')
                      newTitle = `${parts[0].trim()} / ${value}`
                    } else {
                      newTitle = value
                    }

                    const updated = await projectsApi.updateReport(projectId || '', renameModal.id, {
                      title: newTitle,
                      content: report.content
                    })

                    setReports(prev => prev.map(r => r.id === renameModal.id ? updated : r))
                    if (selectedReport?.id === renameModal.id) {
                      setSelectedReport(updated)
                      setTitle(updated.title)
                    }
                  }
                } else {
                  // Folder rename
                  const oldFolder = renameModal.id
                  const newFolder = value

                  // Rename empty folder list
                  setEmptyFolders(prev => prev.map(f => f === oldFolder ? newFolder : f))

                  // Rename all documents inside folder
                  const updatedList = await Promise.all(
                    reports.map(async (r) => {
                      if (r.title.startsWith(`${oldFolder} /`)) {
                        const cleanName = r.title.split('/').slice(1).join('/').trim()
                        const updated = await projectsApi.updateReport(projectId || '', r.id, {
                          title: `${newFolder} / ${cleanName}`,
                          content: r.content
                        })
                        return updated
                      }
                      return r
                    })
                  )
                  setReports(updatedList)

                  // If selected report is in this folder, update title state
                  const currentSelected = updatedList.find(r => r.id === selectedReport?.id)
                  if (currentSelected) {
                    setSelectedReport(currentSelected)
                    setTitle(currentSelected.title)
                  }
                }
              } catch (err) {
                console.error('Error al renombrar:', err)
              } finally {
                setRenameModal(null)
              }
            }}
            className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                <span>✏️</span> Renombrar {renameModal.type === 'folder' ? 'Carpeta' : 'Documento'}
              </h3>
              <button
                type="button"
                onClick={() => setRenameModal(null)}
                className="p-1 hover:bg-[var(--color-surface)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-wider">
                Nuevo Nombre
              </label>
              <input
                type="text"
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value.substring(0, 30))}
                maxLength={30}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
              />
              <div className="flex justify-between items-center text-[10px] text-[var(--color-text-muted)] mt-1">
                <span>Máximo 30 caracteres</span>
                <span>{renameInputValue.length} / 30</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/50">
              <button
                type="button"
                onClick={() => setRenameModal(null)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-danger)] flex items-center gap-1.5">
              <span>⚠️</span> Eliminar Documento Permanentemente
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-wider">
                Ruta del Documento
              </label>
              <input
                type="text"
                readOnly
                value={deleteConfirm.fullTitle}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-muted)] cursor-not-allowed outline-none select-all font-mono"
              />
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              ¿Estás completamente seguro de que deseas eliminar este documento de forma permanente? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/50">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-[var(--color-danger)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Move Confirmation Modal */}
      {folderMoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            {folderMoveConfirm.targetFolder === '__ROOT__' ? (
              <>
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                  <span>📤</span> Extraer Carpeta
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  ¿Estás seguro de que deseas extraer la carpeta <strong className="text-[var(--color-text-primary)]">"{folderMoveConfirm.sourceFolder.split(' / ').pop()}"</strong> y convertirla en una carpeta independiente?
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                  La carpeta y todos sus documentos serán movidos al nivel raíz del proyecto.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                  <span>📁</span> Mover Carpeta
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  ¿Estás seguro de que deseas mover la carpeta <strong className="text-[var(--color-text-primary)]">"{folderMoveConfirm.sourceFolder}"</strong> dentro de la carpeta <strong className="text-emerald-400">"{folderMoveConfirm.targetFolder}"</strong>?
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                  La carpeta <strong>"{folderMoveConfirm.sourceFolder}"</strong> aparecerá como sub-carpeta dentro de <code className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono">{folderMoveConfirm.targetFolder}</code>.
                </p>
              </>
            )}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/50">
              <button
                onClick={() => setFolderMoveConfirm(null)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (folderMoveConfirm.targetFolder === '__ROOT__') {
                    void handleExtractFolderToRoot(folderMoveConfirm.sourceFolder)
                  } else {
                    void handleMoveFolderIntoFolder(folderMoveConfirm.sourceFolder, folderMoveConfirm.targetFolder)
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {folderMoveConfirm.targetFolder === '__ROOT__' ? 'Extraer Carpeta' : 'Mover Carpeta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Modal */}
      {deleteFolderConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-danger)] flex items-center gap-1.5">
              <span>⚠️</span> Eliminar Carpeta
            </h3>
            
            <div className="space-y-2">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                ¿Estás seguro de que deseas eliminar la carpeta <strong className="text-[var(--color-text-primary)]">"{deleteFolderConfirm.folderName}"</strong>?
              </p>
              {deleteFolderConfirm.docCount > 0 && (
                <p className="text-xs text-[var(--color-warning)] leading-relaxed px-3 py-2 rounded-lg bg-[var(--color-warning-subtle)]">
                  ⚡ Esta carpeta contiene <strong>{deleteFolderConfirm.docCount}</strong> documento{deleteFolderConfirm.docCount !== 1 ? 's' : ''} que serán eliminados permanentemente.
                </p>
              )}
              <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/50">
              <button
                onClick={() => setDeleteFolderConfirm(null)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteFolder}
                className="px-4 py-2 rounded-xl bg-[var(--color-danger)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LiveDocumentRenderer({ content, projectId, onSelectReport, reports }: { content: string; projectId: string; onSelectReport: (id: string) => void; reports: ProjectReport[] }) {
  if (!content) return null
  
  // Read reports length to satisfy TS unused variable checks
  if (reports.length === 0) { /* no-op */ }

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
          <li>{parseMarkdownLinks(trimmed.substring(2), onSelectReport)}</li>
        </ul>
      )
    }

    // Default line rendering
    return (
      <p key={index} className="text-sm text-[var(--color-text-secondary)] leading-relaxed min-h-[1rem] whitespace-pre-wrap print:text-black">
        {parseMarkdownLinks(line, onSelectReport)}
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
function parseMarkdownLinks(text: string, onSelectReport: (id: string) => void): React.ReactNode {
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

    if (linkUrl.startsWith('wiki://')) {
      const targetId = linkUrl.replace('wiki://', '')
      parts.push(
        <button
          key={index}
          onClick={() => onSelectReport(targetId)}
          className="inline-flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all shadow-sm cursor-pointer no-print"
        >
          <span>📄</span> {linkText}
        </button>
      )
    } else {
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
    }
    
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

