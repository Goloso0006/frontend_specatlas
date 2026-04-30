import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpProxyMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

const unwrapDataMock = vi.hoisted(() => vi.fn((value) => value))

vi.mock('../api/httpProxy', () => ({
  httpProxy: httpProxyMock,
}))

vi.mock('../api/response', () => ({
  unwrapData: unwrapDataMock,
}))

import { endpoints } from '../api/endpoints'
import { graphApi } from '../api/services/graphApi'

describe('graphApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches impact using the graph impact route', async () => {
    httpProxyMock.get.mockResolvedValueOnce({ id: 'impact-1' })

    await graphApi.getImpact('REQ-1')

    expect(httpProxyMock.get).toHaveBeenCalledWith(endpoints.graph.impact('REQ-1'))
    expect(unwrapDataMock).toHaveBeenCalledWith({ id: 'impact-1' })
  })

  it('posts requirements to infer relations', async () => {
    const requirements = [{ id: 'REQ-1' }, { id: 'REQ-2' }]
    httpProxyMock.post.mockResolvedValueOnce({ relations: [] })

    await graphApi.inferRelations('PRJ-1', requirements as never)

    expect(httpProxyMock.post).toHaveBeenCalledWith(
      endpoints.graph.inferRelations('PRJ-1'),
      requirements,
    )
    expect(unwrapDataMock).toHaveBeenCalledWith({ relations: [] })
  })
})