import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpProxyMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

const unwrapDataMock = vi.hoisted(() => vi.fn((value) => value))
const adaptDiagramResponseMock = vi.hoisted(() => vi.fn((value) => value))
const adaptDiagramResponseListMock = vi.hoisted(() => vi.fn((value) => value))

vi.mock('../api/httpProxy', () => ({
  httpProxy: httpProxyMock,
}))

vi.mock('../api/response', () => ({
  unwrapData: unwrapDataMock,
}))

vi.mock('../adapters/diagram.adapter', () => ({
  adaptDiagramResponse: adaptDiagramResponseMock,
  adaptDiagramResponseList: adaptDiagramResponseListMock,
}))

import { endpoints } from '../api/endpoints'
import { diagramsApi } from '../api/services/diagramsApi'

describe('diagramsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a manual diagram through the manual endpoint', async () => {
    const payload = { projectId: 'PRJ-1', name: 'Manual', sourceJson: '{}', plantUmlCode: null }
    httpProxyMock.post.mockResolvedValueOnce({ id: 'D-1' })
    adaptDiagramResponseMock.mockReturnValueOnce({ id: 'D-1-adapted' })

    const result = await diagramsApi.createManual(payload)

    expect(httpProxyMock.post).toHaveBeenCalledWith(endpoints.diagrams.manual, payload)
    expect(unwrapDataMock).toHaveBeenCalledWith({ id: 'D-1' })
    expect(adaptDiagramResponseMock).toHaveBeenCalledWith({ id: 'D-1' })
    expect(result).toEqual({ id: 'D-1-adapted' })
  })

  it('creates a class diagram automatically', async () => {
    httpProxyMock.post.mockResolvedValueOnce({ id: 'D-2' })
    adaptDiagramResponseMock.mockReturnValueOnce({ id: 'D-2-adapted' })

    const result = await diagramsApi.createAuto('PRJ-2')

    expect(httpProxyMock.post).toHaveBeenCalledWith(endpoints.diagrams.classAuto('PRJ-2'))
    expect(result).toEqual({ id: 'D-2-adapted' })
  })

  it('creates a use-case diagram manually', async () => {
    const payload = {
      projectId: 'PRJ-3',
      name: 'Use case',
      sourceJson: '{}',
      plantUmlCode: '@startuml',
      diagramType: 'USE_CASE' as const,
    }
    httpProxyMock.post.mockResolvedValueOnce({ id: 'D-3' })
    adaptDiagramResponseMock.mockReturnValueOnce({ id: 'D-3-adapted' })

    const result = await diagramsApi.createUseCaseManual(payload)

    expect(httpProxyMock.post).toHaveBeenCalledWith(endpoints.diagrams.useCaseManual, payload)
    expect(result).toEqual({ id: 'D-3-adapted' })
  })

  it('generates a use-case diagram automatically', async () => {
    httpProxyMock.post.mockResolvedValueOnce({ id: 'D-4' })
    adaptDiagramResponseMock.mockReturnValueOnce({ id: 'D-4-adapted' })

    const result = await diagramsApi.generateUseCaseAuto('PRJ-4')

    expect(httpProxyMock.post).toHaveBeenCalledWith(endpoints.diagrams.useCaseAuto('PRJ-4'))
    expect(result).toEqual({ id: 'D-4-adapted' })
  })

  it('updates, exports and lists diagrams using their specific endpoints', async () => {
    httpProxyMock.get.mockResolvedValueOnce({ id: 'D-5' })
    httpProxyMock.put.mockResolvedValueOnce({ id: 'D-6' })
    httpProxyMock.delete.mockResolvedValueOnce(undefined)
    httpProxyMock.post.mockResolvedValueOnce({ id: 'D-7' })
    httpProxyMock.get.mockResolvedValueOnce({ blob: true })
    httpProxyMock.get.mockResolvedValueOnce({ blob: true, text: true })
    httpProxyMock.get.mockResolvedValueOnce([{ id: 'D-8' }])

    adaptDiagramResponseMock.mockImplementation((value) => value)
    adaptDiagramResponseListMock.mockReturnValueOnce([{ id: 'D-8' }])

    await diagramsApi.getById('D-5')
    await diagramsApi.update('D-6', { projectId: 'PRJ-6', name: 'Updated', sourceJson: '{}', plantUmlCode: null })
    await diagramsApi.remove('D-7')
    await diagramsApi.generatePlantUml('D-7')
    await diagramsApi.exportPlantUml('D-7')
    await diagramsApi.exportText('D-7')
    await diagramsApi.listByProject('PRJ-8')

    expect(httpProxyMock.get).toHaveBeenCalledWith(endpoints.diagrams.byId('D-5'))
    expect(httpProxyMock.put).toHaveBeenCalledWith(
      endpoints.diagrams.byId('D-6'),
      { projectId: 'PRJ-6', name: 'Updated', sourceJson: '{}', plantUmlCode: null },
    )
    expect(httpProxyMock.delete).toHaveBeenCalledWith(endpoints.diagrams.byId('D-7'))
    expect(httpProxyMock.post).toHaveBeenCalledWith(endpoints.diagrams.plantUml('D-7'))
    expect(httpProxyMock.get).toHaveBeenCalledWith(endpoints.diagrams.exportPlantUml('D-7'), { responseType: 'blob' })
    expect(httpProxyMock.get).toHaveBeenCalledWith(endpoints.diagrams.exportText('D-7'), { responseType: 'blob' })
    expect(httpProxyMock.get).toHaveBeenCalledWith(endpoints.diagrams.byProject('PRJ-8'))
    expect(adaptDiagramResponseListMock).toHaveBeenCalledWith([{ id: 'D-8' }])
  })
})