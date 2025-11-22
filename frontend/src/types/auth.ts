// 用户认证相关类型定义
export interface User {
  id: string
  username: string
  email?: string
  avatar?: string
  phone?: string
  role?: string
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  token: string
  expiresIn: number
}

export interface Subscription {
  id: string
  name: string
  price: number
  features: string[]
  queryLimit: number
  expiresAt: string
}

export interface SubscriptionPlan {
  id: string
  name: 'Free' | 'Basic' | 'Premium'
  price: number
  queryLimit: number
  features: string[]
  description: string
}