export type RoleType = 'ADMIN' | 'ANALYST' | 'VIEWER'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
  userId: string
  role: RoleType
}

export interface SessionUser {
  userId: string
  role: RoleType
}
