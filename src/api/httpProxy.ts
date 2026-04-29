import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { apiClient } from './client'

export interface ProxyErrorDetails {
  status?: number
  method?: string
  url?: string
  code?: string
  message: string
  data?: unknown
}

export class ApiProxyError extends Error {
  status?: number
  method?: string
  url?: string
  code?: string
  data?: unknown

  constructor(details: ProxyErrorDetails) {
    super(details.message)
    this.name = 'ApiProxyError'
    this.status = details.status
    this.method = details.method
    this.url = details.url
    this.code = details.code
    this.data = details.data
  }
}

interface CacheEntry<T> {
  expiresAt: number
  data: T
}

export class HttpProxy {
  private readonly cache = new Map<string, CacheEntry<unknown>>()

  constructor(
    private readonly client: AxiosInstance = apiClient,
    private readonly cacheTtlMs = 30_000,
  ) {}

  async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'get', url })
  }

  async post<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'post', url, data })
  }

  async put<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'put', url, data })
  }

  async delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'delete', url })
  }

  clearCache(): void {
    this.cache.clear()
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clearCache()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const method = (config.method ?? 'get').toLowerCase()
    const cacheKey = this.buildCacheKey(config)

    if (method === 'get') {
      const cached = this.readCache<T>(cacheKey)
      if (cached !== null) {
        return cached
      }
    }

    try {
      const response = await this.client.request<T>(config)
      const data = response.data

      if (method === 'get') {
        this.writeCache(cacheKey, data)
      } else {
        this.clearCache()
      }

      return data
    } catch (error) {
      throw this.normalizeError(error)
    }
  }

  private readCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  private writeCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.cacheTtlMs,
    })
  }

  private buildCacheKey(config: AxiosRequestConfig): string {
    const method = (config.method ?? 'get').toLowerCase()
    const url = config.url ?? ''
    const params = config.params ? JSON.stringify(config.params) : ''
    const data = config.data ? JSON.stringify(config.data) : ''
    return `${method}:${url}:${params}:${data}`
  }

  private normalizeError(error: unknown): ApiProxyError {
    const axiosError = error as AxiosError<{ message?: string; data?: unknown }>
    const response = axiosError?.response
    const responseMessage =
      typeof response?.data === 'object' && response.data !== null && 'message' in response.data
        ? response.data.message
        : undefined

    return new ApiProxyError({
      status: response?.status,
      method: axiosError.config?.method?.toUpperCase(),
      url: axiosError.config?.url,
      code: axiosError.code,
      message: responseMessage ?? axiosError.message ?? 'Request failed',
      data: response?.data,
    })
  }
}

export const httpProxy = new HttpProxy()
