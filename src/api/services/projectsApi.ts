import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { httpProxy } from '../httpProxy'
import { adaptProjectResponse, adaptProjectResponses } from '../../adapters/projects.adapter'
import type { ApiResponse } from '../../types/api'
import type { ProjectRequest, ProjectResponse, ProjectReport } from '../../types/projects'
import jsPDF from 'jspdf'

export interface ExportToGoogleDocsRequest {
  title: string
  content: string
  tableHeaders?: string[]
  tableRows?: (string | number)[][]
  folderId?: string
}

export interface ExportData {
  documentId: string
  documentLink: string
  documentName: string
}

export interface ExportToGoogleDocsResponse {
  success: boolean
  message: string
  data: ExportData
}

const addTableToPDF = (
  doc: any,
  headers: string[],
  rows: (string | number)[][],
  margin: number,
  startY: number,
  pageWidth: number,
  pageHeight: number
): number => {
  const columnWidth = (pageWidth - margin * 2) / headers.length
  const rowHeight = 8
  let currentY = startY

  doc.setFillColor(79, 70, 229)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.setFontSize(10)

  headers.forEach((header, i) => {
    const x = margin + i * columnWidth
    doc.rect(x, currentY, columnWidth, rowHeight, 'F')
    doc.text(header || '', x + 2, currentY + 6, { maxWidth: columnWidth - 4 })
  })

  currentY += rowHeight

  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)

  rows.forEach((row, rowIndex) => {
    if (currentY + rowHeight > pageHeight - margin) {
      doc.addPage()
      currentY = margin

      doc.setFillColor(79, 70, 229)
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)

      headers.forEach((header, i) => {
        const x = margin + i * columnWidth
        doc.rect(x, currentY, columnWidth, rowHeight, 'F')
        doc.text(header || '', x + 2, currentY + 6, { maxWidth: columnWidth - 4 })
      })

      currentY += rowHeight
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'F')
    }

    row.forEach((cell, i) => {
      const x = margin + i * columnWidth
      doc.text(String(cell || ''), x + 2, currentY + 6, { maxWidth: columnWidth - 4 })
    })

    currentY += rowHeight
  })

  return currentY + 10
}

export const projectsApi = {
  async create(payload: ProjectRequest): Promise<ProjectResponse> {
    const data = await httpProxy.post<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.base,
      payload,
    )
    return adaptProjectResponse(unwrapData(data))
  },

  async getById(id: string): Promise<ProjectResponse> {
    const data = await httpProxy.get<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.byId(id),
    )
    return adaptProjectResponse(unwrapData(data))
  },

  async listByUser(ownerId: string): Promise<ProjectResponse[]> {
    const data = await httpProxy.get<ProjectResponse[] | ApiResponse<ProjectResponse[]>>(
      endpoints.projects.byUser(ownerId),
    )
    return adaptProjectResponses(unwrapData(data))
  },

  async update(id: string, payload: ProjectRequest): Promise<ProjectResponse> {
    const data = await httpProxy.put<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.byId(id),
      payload,
    )
    return adaptProjectResponse(unwrapData(data))
  },

  async remove(id: string): Promise<void> {
    await httpProxy.delete(endpoints.projects.byId(id))
  },

  async getReports(projectId: string): Promise<ProjectReport[]> {
    const data = await httpProxy.get<ProjectReport[] | ApiResponse<ProjectReport[]>>(
      `/api/projects/${projectId}/reports`
    )
    return unwrapData(data)
  },

  async getReportById(projectId: string, reportId: string): Promise<ProjectReport> {
    const data = await httpProxy.get<ProjectReport | ApiResponse<ProjectReport>>(
      `/api/projects/${projectId}/reports/${reportId}`
    )
    return unwrapData(data)
  },

  async createReport(projectId: string, payload: Partial<ProjectReport>): Promise<ProjectReport> {
    const data = await httpProxy.post<ProjectReport | ApiResponse<ProjectReport>>(
      `/api/projects/${projectId}/reports`,
      payload
    )
    return unwrapData(data)
  },

  async updateReport(projectId: string, reportId: string, payload: Partial<ProjectReport>): Promise<ProjectReport> {
    const data = await httpProxy.put<ProjectReport | ApiResponse<ProjectReport>>(
      `/api/projects/${projectId}/reports/${reportId}`,
      payload
    )
    return unwrapData(data)
  },

  async deleteReport(projectId: string, reportId: string): Promise<void> {
    await httpProxy.delete(`/api/projects/${projectId}/reports/${reportId}`)
  },
}

export const exportApi = {
  async exportToGoogleDocs(payload: ExportToGoogleDocsRequest): Promise<ExportData> {
    const data = await httpProxy.post<ExportToGoogleDocsResponse>(
      '/api/export/google-docs',
      payload,
    )

    if (!data.success) {
      throw new Error(data.message || 'Error al exportar a Google Docs')
    }

    return data.data
  },

  async exportToPDFLocal(
    title: string,
    content: string,
    tableHeaders?: string[],
    tableRows?: (string | number)[][]
  ): Promise<void> {
    const doc: any = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let currentY = margin

    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text(title, margin, currentY)
    currentY += 15

    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    const contentLines = doc.splitTextToSize(content || '', pageWidth - margin * 2)
    doc.text(contentLines, margin, currentY)
    currentY += contentLines.length * 7 + 10

    if (tableHeaders && tableRows && tableRows.length > 0) {
      currentY = addTableToPDF(
        doc,
        tableHeaders,
        tableRows,
        margin,
        currentY,
        pageWidth,
        pageHeight
      )
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`)
  },
}
