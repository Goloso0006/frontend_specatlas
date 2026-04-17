import { apiClient } from '../client'
import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { setAccessToken, setSessionUser } from '../../store/session'
import type { ApiResponse } from '../../types/api'
import type { LoginRequest, LoginResponse, RegisterRequest } from '../../types/auth'

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse | ApiResponse<LoginResponse>>(
      endpoints.auth.login,
      payload,
    )
    const loginData = unwrapData(data)
    setAccessToken(loginData.token)
    setSessionUser({ userId: loginData.userId, role: loginData.role })
    return loginData
  },

  async register(payload: RegisterRequest): Promise<void> {
    await apiClient.post<void>(endpoints.auth.register, payload)
  },
}
