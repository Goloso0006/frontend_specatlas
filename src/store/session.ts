import type { SessionUser } from '../types/auth'

export const SESSION_KEYS = {
  token: 'access_token',
  user: 'session_user',
} as const

export function getAccessToken(): string | null {
  return sessionStorage.getItem(SESSION_KEYS.token)
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(SESSION_KEYS.token, token)
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(SESSION_KEYS.token)
}

export function setSessionUser(user: SessionUser): void {
  sessionStorage.setItem(SESSION_KEYS.user, JSON.stringify(user))
}

export function getSessionUser(): SessionUser | null {
  const raw = sessionStorage.getItem(SESSION_KEYS.user)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function clearSessionUser(): void {
  sessionStorage.removeItem(SESSION_KEYS.user)
}

export function clearSession(): void {
  clearAccessToken()
  clearSessionUser()
}
