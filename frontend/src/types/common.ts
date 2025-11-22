// 通用类型定义
export interface BaseResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export type Theme = 'light' | 'dark' | 'auto'
export type Language = 'zh-CN' | 'en-US'