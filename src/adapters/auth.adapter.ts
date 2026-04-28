import type { LoginResponse, RoleType, SessionUser } from '../types/auth'
import { normalizeNumber, normalizeString } from './common'

const VALID_ROLES = new Set<RoleType>(['ADMIN', 'ANALYST', 'VIEWER'])

function normalizeRole(value: unknown): RoleType {
  if (typeof value === 'string' && VALID_ROLES.has(value as RoleType)) {
    return value as RoleType
  }

  return 'VIEWER'
}

export function adaptLoginResponse(response: Partial<LoginResponse> | null | undefined): LoginResponse {
  return {
    token: normalizeString(response?.token),
    expiresIn: normalizeNumber(response?.expiresIn),
    userId: normalizeString(response?.userId),
    role: normalizeRole(response?.role),
  }
}

export function adaptSessionUser(response: Partial<LoginResponse> | null | undefined): SessionUser {
  const login = adaptLoginResponse(response)

  return {
    userId: login.userId,
    role: login.role,
  }
}
