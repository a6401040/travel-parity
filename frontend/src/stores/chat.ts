import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '@/types/travel'
import type { Conversation } from '@/types/chat'
import api from '@/services/http'
import { useTravelStore } from './travel'

export const useChatStore = defineStore('chat', () => {
  // 状态
  const messages = ref<Message[]>([])
  const currentConversation = ref<string | null>(null)
  const conversations = ref<Conversation[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 计算属性
  const currentMessages = computed(() => messages.value)
  const conversationCount = computed(() => conversations.value.length)
  const hasConversations = computed(() => conversations.value.length > 0)

  // 方法
  const setMessages = (newMessages: Message[]) => {
    messages.value = newMessages
  }

  const addMessage = (message: Message) => {
    messages.value.push(message)
  }

  const setCurrentConversation = (conversationId: string | null) => {
    currentConversation.value = conversationId
  }

  const setConversations = (newConversations: Conversation[]) => {
    conversations.value = newConversations
  }

  const addConversation = (conversation: Conversation) => {
    conversations.value.unshift(conversation)
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    // 创建用户消息
    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      type: 'text'
    }

    addMessage(userMessage)

    try {
      const isPairIntent = (() => {
        const m = content.match(/([\u4e00-\u9fa5]{2,})\s*(到|至|飞)\s*([\u4e00-\u9fa5]{2,})/)
        if (!m) return null
        return { origin: m[1], destination: m[3] }
      })()
      const isCityIntent = (() => {
        const m = content.match(/([\u4e00-\u9fa5]{2,})的(酒店|路线|行程|景点)/)
        return m ? m[1] : null
      })()
      let assistantText = ''
      let payloadForHistory: any = {}
      if (isPairIntent) {
        const travel = useTravelStore()
        const q = { origin: isPairIntent.origin, destination: isPairIntent.destination, date: (travel.currentQuery?.date || '2025-12-01') }
        const rec = await api.post('/llm/recommendations', { origin: q.origin, destination: q.destination, date: q.date, preferences: {}, constraints: {} })
        const data = rec.data || {}
        const comp = await api.get('/compiled/recommendations', { params: { city: q.destination, origin: q.origin, destination: q.destination, date: q.date, budgetMax: 0, ratingMin: 3, interests: '美食', limit: 20 } })
        const c = comp.data || {}
        const priceFirst = (data?.schemes?.priceFirst || [])
        if (priceFirst.length > 0) {
          const s = priceFirst[0]
          const tp = (s as any)?.totalPrice ?? (s as any)?.price ?? '-'
          const tt = (s as any)?.totalDurationMin ?? (s as any)?.durationMin ?? '-'
          const segs = (s as any)?.segments?.length ?? (s as any)?.segmentCount ?? '-'
          const f = (c?.transport?.flights || []).slice(0, 2).map((x: any) => `${x.carrier || x.airline || ''}${x.flightNo || ''} ¥${x.price || (x?.cabin?.[0]?.price ?? '-')}`).join('，')
          const h = (c?.recommendedHotels || []).slice(0, 3).map((x: any) => `${x.name} 评分${x.rating || '-'} 距离${x.distanceKm || '-'}km`).join('；')
          assistantText = `为您生成${q.origin}→${q.destination}的省钱方案：总价¥${tp}，总时长${tt}分钟，分段${segs}。` +
            `${(f ? '航班示例：' + f + '。' : '航班数据：近10天内未查询到该航线或日期超出范围。')}` +
            `酒店推荐：${h || '暂无'}`
        } else {
          const f = (c?.transport?.flights || []).slice(0, 2).map((x: any) => `${x.carrier || x.airline || ''}${x.flightNo || ''} ¥${x.price || (x?.cabin?.[0]?.price ?? '-')}`).join('，')
          const h = (c?.recommendedHotels || []).slice(0, 3).map((x: any) => `${x.name} 评分${x.rating || '-'} 距离${x.distanceKm || '-'}km`).join('；')
          assistantText = `为您生成${q.origin}→${q.destination}的省钱方案：` +
            `${(f ? '航班示例：' + f + '。' : '航班数据：近10天内未查询到该航线或日期超出范围。')}` +
            `酒店推荐：${h || '暂无'}`
        }
        payloadForHistory = { request: { query: q, input: content }, response: { recommendations: data, compiled: c } }
      } else if (isCityIntent) {
        const city = isCityIntent
        const budgetMatch = content.match(/(\d{2,4})\s*左右|价格\s*在\s*(\d{2,4})/)
        const budgetMax = budgetMatch ? Number(budgetMatch[1] || budgetMatch[2]) : undefined
        const comp = await api.get('/compiled/recommendations', { params: { city, date: (useTravelStore().currentQuery?.date || '2025-12-01'), budgetMax: budgetMax || 0, ratingMin: 3, interests: '美食', limit: 20 } })
        const c = comp.data || {}
        const h = (c?.recommendedHotels || []).slice(0, 3).map((x: any) => `${x.name} 评分${x.rating || '-'} 距离${x.distanceKm || '-'}km`).join('；')
        const routeDays = Array.isArray(c?.routes) && c.routes[0]?.dailyPlan ? c.routes[0].dailyPlan.length : 3
        assistantText = `${city}的${routeDays}日路线与酒店推荐：${budgetMax ? `预算约¥${budgetMax}，` : ''}酒店（评分优先）${h || '暂无'}。每日路线请查看编排详情。`
        payloadForHistory = { request: { input: content }, response: { compiled: c } }
      } else {
        const r = await api.post('/llm/chat', { text: content })
        assistantText = String(r?.data?.content || '')
        payloadForHistory = { request: { input: content }, response: { content: assistantText } }
      }
      const assistantMessage: Message = { id: generateId(), content: assistantText, role: 'assistant', timestamp: new Date().toISOString(), type: 'text' }
      addMessage(assistantMessage)
      try {
        const title = extractTitle(content)
        const h = await api.post('/history', { title, ...payloadForHistory })
        const hid = String(h?.data?.id || generateId())
        if (!currentConversation.value) {
          const newConversation: Conversation = { id: hid, title, messages: [userMessage, assistantMessage], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          addConversation(newConversation)
          setCurrentConversation(newConversation.id)
        }
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送消息失败')
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (conversationId: string) => {
    setLoading(true)
    setError(null)

    try {
      const h = await api.get(`/history/${conversationId}`)
      const row = h.data || {}
      const msgs: Message[] = []
      const reqText = row?.request ? JSON.stringify(row.request) : ''
      const respText = row?.response ? JSON.stringify(row.response) : ''
      if (reqText) msgs.push({ id: generateId(), content: reqText, role: 'user', timestamp: new Date().toISOString(), type: 'text' })
      if (respText) msgs.push({ id: generateId(), content: respText, role: 'assistant', timestamp: new Date().toISOString(), type: 'text' })
      setMessages(msgs)
      setCurrentConversation(conversationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载会话失败')
    } finally {
      setLoading(false)
    }
  }

  const newConversation = async () => {
    // 创建新的会话
    const newConv: Conversation = {
      id: generateId(),
      title: `新对话 ${conversations.value.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    try {
      const h = await api.post('/history', { title: newConv.title, request: {}, response: {} })
      const hid = String(h?.data?.id || newConv.id)
      newConv.id = hid
    } catch {}
    addConversation(newConv)
    setCurrentConversation(newConv.id)
    setMessages([])
    setError(null)
    
    return newConv
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      await api.delete(`/history/${conversationId}`)
      const index = conversations.value.findIndex(c => c.id === conversationId)
      if (index !== -1) {
        conversations.value.splice(index, 1)
        if (currentConversation.value === conversationId) {
          currentConversation.value = null
          messages.value = []
        }
        conversations.value = [...conversations.value]
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除会话失败')
    }
  }

  const clearAllConversations = async () => {
    try {
      // TODO: 实现API调用清空所有会话
      conversations.value = []
      currentConversation.value = null
      messages.value = []
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空会话失败')
    }
  }

  // 辅助函数
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const extractTitle = (content: string): string => {
    // 从用户输入中提取标题
    if (content.length > 30) {
      return content.substring(0, 30) + '...'
    }
    return content
  }

  return {
    // 状态
    messages,
    currentConversation,
    conversations,
    isLoading,
    error,
    
    // 计算属性
    currentMessages,
    conversationCount,
    hasConversations,
    
    // 方法
    setMessages,
    addMessage,
    setCurrentConversation,
    setConversations,
    addConversation,
    setLoading,
    setError,
    sendMessage,
    loadConversation,
    newConversation,
    deleteConversation,
    clearAllConversations
  }
})