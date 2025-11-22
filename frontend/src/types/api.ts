// API相关类型定义
import type { BaseResponse } from './common'
import type { User, AuthResponse, SubscriptionPlan } from './auth'
import type { TravelRecommendation, TravelQuery } from './travel'

// 请求配置
export interface ApiRequestConfig {
  timeout?: number
  headers?: Record<string, string>
  retry?: number
  retryDelay?: number
}

// 分页响应
export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 错误响应
export interface ErrorResponse {
  code: number
  message: string
  details?: any
}

// 具体API响应类型
export interface LoginResponse extends BaseResponse<AuthResponse> {}
export interface RegisterResponse extends BaseResponse<User> {}
export interface UserProfileResponse extends BaseResponse<User> {}
export interface SubscriptionPlansResponse extends BaseResponse<SubscriptionPlan[]> {}
export interface TravelRecommendationResponse extends BaseResponse<TravelRecommendation> {}
export interface ConversationHistoryResponse extends BaseResponse<TravelQuery[]> {}