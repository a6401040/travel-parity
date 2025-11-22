// 聊天相关类型定义
import type { Message } from './travel'

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  messageCount?: number
  lastMessage?: string
  summary?: {
    origin: string
    destination: string
    lowestPrice: number
    shortestDuration: number
  }
}

export interface ChatState {
  conversations: Conversation[]
  currentConversation: string | null
  messages: Message[]
  isLoading: boolean
  error: string | null
}