import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/services/authApi'
import {
  AUTH_SESSION_CLEARED_EVENT,
  clearSession,
  getAccessToken,
  getSessionUser,
} from '../store/session'
import type { LoginRequest, RegisterRequest, SessionUser } from '../types/auth'
import { AuthContext, type AuthContextValue, type AuthStatus } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const [token, setToken] = useState<string | null>(() => {
    const storedToken = getAccessToken()
    const storedUser = getSessionUser()
    return storedToken && storedUser ? storedToken : null
  })

  const [user, setUser] = useState<SessionUser | null>(() => {
    const storedToken = getAccessToken()
    const storedUser = getSessionUser()
    return storedToken && storedUser ? storedUser : null
  })

  const normalizedToken = token && user ? token : null
  const normalizedUser = token && user ? user : null
  const isAuthenticated = Boolean(normalizedToken && normalizedUser)
  const status: AuthStatus = isAuthenticated ? 'authenticated' : 'unauthenticated'

  const login = useCallback(async (payload: LoginRequest): Promise<void> => {
    const data = await authApi.login(payload)
    setToken(data.token)
    setUser({ userId: data.userId, role: data.role })
  }, [])

  const register = useCallback(async (payload: RegisterRequest): Promise<void> => {
    await authApi.register(payload)
  }, [])

  const logout = useCallback((): void => {
    clearSession()
  }, [])

  useEffect(() => {
    function handleSessionCleared(): void {
      setToken(null)
      setUser(null)
      navigate('/login', { replace: true })
    }

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared)
    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared)
    }
  }, [navigate])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated,
      token: normalizedToken,
      user: normalizedUser,
      login,
      register,
      logout,
    }),
    [status, isAuthenticated, normalizedToken, normalizedUser, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
