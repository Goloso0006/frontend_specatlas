import { authApi } from '../api/services/authApi'
import type { LoginRequest, RegisterRequest } from '../types/auth'

export class AuthFacade {
  constructor(private api = authApi) {}

  async login(payload: LoginRequest) {
    return this.api.login(payload)
  }

  async register(payload: RegisterRequest) {
    return this.api.register(payload)
  }
}

export const authFacade = new AuthFacade()
