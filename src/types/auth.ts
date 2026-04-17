export type RoleType = 'ADMIN' | 'ANALYST' | 'VIEWER'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  lastName: string
  phoneNumber: string
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
