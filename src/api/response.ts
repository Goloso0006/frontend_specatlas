import type { ApiResponse } from '../types/api'

function isApiResponse<T>(payload: T | ApiResponse<T>): payload is ApiResponse<T> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    'message' in payload &&
    'data' in payload
  )
}

export function unwrapData<T>(payload: T | ApiResponse<T>): T {
  return isApiResponse(payload) ? payload.data : payload
}