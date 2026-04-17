import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, SessionUser } from '../types/auth'

export type AuthStatus = 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  isAuthenticated: boolean
  token: string | null
  user: SessionUser | null
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
