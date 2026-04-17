import { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, getAccessToken } from '../store/session'

export function withAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

export function handleUnauthorized(error: unknown): Promise<never> {
  if (isAxiosError(error) && error.response?.status === 401) {
    clearSession()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }

  return Promise.reject(error)
}
