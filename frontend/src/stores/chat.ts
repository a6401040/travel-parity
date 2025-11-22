import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '@/types/travel'
import type { Conversation } from '@/types/chat'
import api from '@/services/http'
import { useAuthStore } from '@/stores/auth'
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
        const arrow = content.match(/([\u4e00-\u9fa5]{2,})\s*(→|->|—>|－>|➡️|→)\s*([\u4e00-\u9fa5]{2,})/)
        if (arrow) return { origin: arrow[1], destination: arrow[3] }
        const m = content.match(/([\u4e00-\u9fa5]{2,})\s*(到|至|飞)\s*([\u4e00-\u9fa5]{2,})/)
        if (m) return { origin: m[1], destination: m[3] }
        return null
      })()
      const dateFromText = (() => {
        const now = new Date()
        const fmt = (d: Date) => {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${y}-${m}-${day}`
        }
        if (/今天|今日/.test(content)) return fmt(now)
        if (/明天|翌日/.test(content)) { const d = new Date(now); d.setDate(d.getDate() + 1); return fmt(d) }
        if (/后天/.test(content)) { const d = new Date(now); d.setDate(d.getDate() + 2); return fmt(d) }
        if (/大后天/.test(content)) { const d = new Date(now); d.setDate(d.getDate() + 3); return fmt(d) }
        if (/本周/.test(content)) return fmt(now)
        if (/下周/.test(content)) { const d = new Date(now); const day = d.getDay() || 7; const add = 7 - day + 1; d.setDate(d.getDate() + add); return fmt(d) }
        const md = content.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/)
        if (md) { const d = new Date(now.getFullYear(), Number(md[1]) - 1, Number(md[2])); return fmt(d) }
        const nearN = content.match(/近(\d+)天|最近几天/)
        if (nearN) return fmt(now)
        const m = content.match(/(\d{4})[-年](\d{1,2})[-月](\d{1,2})日?/)
        if (m) {
          const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
          return fmt(d)
        }
        if (/下周一/.test(content)) {
          const d = new Date(now)
          const day = d.getDay() || 7
          const add = 7 - day + 1
          d.setDate(d.getDate() + add)
          return fmt(d)
        }
        return null
      })()
      const wantPriceOnly = /最省钱|价格最佳|价格优先|便宜/.test(content)
      const isCityIntent = (() => {
        const m = content.match(/([\u4e00-\u9fa5]{2,})的(酒店|路线|行程|景点)/)
        return m ? m[1] : null
      })()
      const isTrainScheduleIntent = /火车|高铁|动车/.test(content) && /时段|班次|时间/.test(content)
      let assistantText = ''
      const queryCache = (globalThis as any).__travelQueryCache || ((globalThis as any).__travelQueryCache = new Map<string, string>())
      let payloadForHistory: any = {}
      const auth = useAuthStore()
      if (isPairIntent && isTrainScheduleIntent) {
        const travel = useTravelStore()
        const qDate = (dateFromText || travel.currentQuery?.departureDate || new Date().toISOString().slice(0,10))
        // 查询站点 telecode
        const [fromInfo, toInfo] = await Promise.all([
          api.get('/mcp/station-info', { params: { keyword: isPairIntent.origin } }),
          api.get('/mcp/station-info', { params: { keyword: isPairIntent.destination } })
        ])
        const pickTele = (rows: any[]) => {
          const r = rows?.[0]
          return r?.telecode || r?.station_telecode || r?.code || ''
        }
        const fromCode = pickTele(fromInfo.data?.data || [])
        const toCode = pickTele(toInfo.data?.data || [])
        if (!fromCode || !toCode) {
          assistantText = `# 列车时段查询\n- 未找到站点编码，请检查出发地/到达地：${isPairIntent.origin} / ${isPairIntent.destination}`
        } else {
          const list = await api.get('/mcp/train-list', { params: { from_station: fromCode, to_station: toCode, date: qDate } })
          const rows = list.data?.data || []
          if (!Array.isArray(rows) || rows.length === 0) {
            assistantText = `# 列车时段查询\n- 日期：${qDate}\n- 路线：${isPairIntent.origin} → ${isPairIntent.destination}\n- 结果：当日无匹配车次或暂不可查询`
          } else {
            const lines = rows.slice(0, 20).map((r: any) => `- ${r.start_time} ${r.start_train_code} ${r.from_station} → ${r.to_station}（历时 ${r.lishi}）`)
            assistantText = [`# 列车时段查询`,
              `- 日期：${qDate}`,
              `- 路线：${isPairIntent.origin} → ${isPairIntent.destination}`,
              `## 车次与时段（前20条）`,
              ...lines
            ].join('\n')
          }
        }
        payloadForHistory = { request: { input: content }, response: { content: assistantText } }
      } else if (isPairIntent) {
        const travel = useTravelStore()
        const q = { origin: isPairIntent.origin, destination: isPairIntent.destination, date: (dateFromText || travel.currentQuery?.departureDate || new Date().toISOString().slice(0,10)) }
        const cacheKey = `${q.origin}|${q.destination}|${q.date}`
        if (queryCache.has(cacheKey)) {
          const cachedHtml = queryCache.get(cacheKey) as string
          const assistantMessage: Message = { id: generateId(), content: cachedHtml, role: 'assistant', timestamp: new Date().toISOString(), type: 'text' }
          addMessage(assistantMessage)
          setLoading(false)
          return
        }
        const [rec, comp] = await Promise.all([
          api.post('/llm/recommendations', { origin: q.origin, destination: q.destination, date: q.date, preferences: {}, constraints: {} }),
          api.get('/compiled/recommendations', { params: { city: q.destination, origin: q.origin, destination: q.destination, date: q.date, budgetMax: 0, ratingMin: 3, interests: '美食', limit: 20 } })
        ])
        const data = rec.data || {}
        const c = comp.data || {}
        let timeFirst = (data?.schemes?.timeFirst || [])
        let priceFirst = (data?.schemes?.priceFirst || [])
        let tf = timeFirst[0]
        let pf = priceFirst[0]
        const fmtSegs = (s: any) => (Array.isArray(s?.segments) ? s.segments.map((seg: any) => {
          const price = Number(seg.price ?? 0)
          const time = (seg.departTime && seg.arriveTime) ? `${seg.departTime} → ${seg.arriveTime}` : ''
          const link = seg?.booking?.url ? ` 购票:${seg.booking.url}` : ''
          return `${seg.mode === 'flight' ? '航班' : '火车'} ${seg.optionId} ${time} ￥${price}${link ? ' ' + link : ''}`
        }).join('；') : '无分段数据')
        const riskNotes = (s: any) => {
          const notes: string[] = []
          if (Array.isArray(s?.segments)) {
            const arr = s.segments
            const last = arr[arr.length - 1]
            const arrive = String(last?.arriveTime || '')
            const hourMatch = arrive.match(/T(\d{2}):/)
            const hour = hourMatch ? Number(hourMatch[1]) : NaN
            if (!Number.isNaN(hour) && (hour >= 22 || hour < 6)) notes.push('夜间到达')
          }
          const transfers = Number(s?.transfers ?? 0)
          if (transfers > 2) notes.push('换乘较多')
          return notes.length ? notes.join('，') : '无'
        }
        const flightsDb = (c?.transport?.flights || []).slice(0, 3)
        const flightsHtml = flightsDb.length > 0
          ? flightsDb.map((x: any) => `<span class="code">${x.carrier || x.airline || ''}${x.flightNo || ''}</span> <span class="price">￥${Number(x.price ?? 0)}</span>`).join('，')
          : '航班数据缺失（近10天或条件不匹配）'
        const hotelsFiltered = (c?.recommendedHotels || []).filter((h: any) => {
          const an = String(h.adname || '')
          const addr = String(h.address || '')
          return an.includes(q.destination) || addr.includes(q.destination) || q.destination.includes(an)
        })
        const hotelsHtml = (hotelsFiltered.length ? hotelsFiltered : (c?.recommendedHotels || [])).slice(0, 3).map((x: any) => {
          const dist = Number(x.distanceKm)
          const distStr = Number.isFinite(dist) ? `${dist}km` : ''
          return `${x.name} 评分${Number(x.rating ?? 0)}${distStr ? ' 距离' + distStr : ''}`
        }).join('；') || '暂无'

        const segmentsHtml = (s: any) => {
          const segs = Array.isArray(s?.segments) ? s.segments : []
          if (segs.length === 0) return '<li>无分段数据</li>'
          const prices = segs.map((z: any) => Number(z.price ?? 0))
          const minP = Math.min(...prices)
          const maxP = Math.max(...prices)
          return segs.map((seg: any) => {
            const price = Number(seg.price ?? 0)
            const time = (seg.departTime && seg.arriveTime) ? `${seg.departTime} → ${seg.arriveTime}` : ''
            const link = seg?.booking?.url ? `<a target="_blank" rel="noopener noreferrer" href="${seg.booking.url}">购票</a>` : ''
            const typeClass = seg.mode === 'flight' ? 'flight' : 'train'
            const priceClass = price <= minP ? 'low' : (price >= maxP ? 'high' : 'med')
            return `<li class="segment-item"><span class="code ${typeClass}">${seg.mode === 'flight' ? '航班' : '火车'} ${seg.optionId}</span> <span class="time">${time}</span> <span class="price ${priceClass}">￥${price}</span> ${link}</li>`
          }).join('')
        }

        const timeSum = (Number(tf?.totalTimeMinutes || 0) + Number(pf?.totalTimeMinutes || 0)) || Number(tf?.totalTimeMinutes || pf?.totalTimeMinutes || 0) || 1
        const priceSum = (Number(tf?.totalPrice || 0) + Number(pf?.totalPrice || 0)) || Number(tf?.totalPrice || pf?.totalPrice || 0) || 1
        const tfTimePct = tf ? Math.max(8, Math.round((Number(tf.totalTimeMinutes) / timeSum) * 100)) : 0
        const tfPricePct = tf ? Math.max(8, Math.round((Number(tf.totalPrice) / priceSum) * 100)) : 0
        const pfTimePct = pf ? Math.max(8, Math.round((Number(pf.totalTimeMinutes) / timeSum) * 100)) : 0
        const pfPricePct = pf ? Math.max(8, Math.round((Number(pf.totalPrice) / priceSum) * 100)) : 0

        if ((!tf && !pf)) {
          try {
            const og = await api.get('/amap/geo', { params: { address: `${q.origin}市`, city: q.origin } })
            const dg = await api.get('/amap/geo', { params: { address: `${q.destination}市`, city: q.destination } })
            const oloc = og.data?.data?.geocodes?.[0]?.location || ''
            const dloc = dg.data?.data?.geocodes?.[0]?.location || ''
            if (oloc && dloc) {
              const tr = await api.get('/amap/transit', { params: { from: oloc, to: dloc, city: q.origin, cityd: q.destination } })
              const trans = tr.data?.data?.route?.transits || []
              const items = trans.map((t: any) => ({ dur: Number(t.duration || 0), cost: Number(t.cost || 0) }))
                .filter((x: any) => Number.isFinite(x.dur) && Number.isFinite(x.cost) && x.dur > 0 && x.cost >= 0)
              if (items.length > 0) {
                const timeBest = [...items].sort((a, b) => a.dur - b.dur)[0]
                const priceBest = [...items].sort((a, b) => a.cost - b.cost)[0]
                (data.schemes ||= {})
                data.schemes.timeFirst = [{ title: '时间优先', totalTimeMinutes: Math.round(timeBest.dur / 60), totalPrice: timeBest.cost, transfers: 1, segments: [] }]
                data.schemes.priceFirst = [{ title: '价格优先', totalTimeMinutes: Math.round(priceBest.dur / 60), totalPrice: priceBest.cost, transfers: 2, segments: [] }]
              }
            }
          } catch {}
        }

        timeFirst = (data?.schemes?.timeFirst || [])
        priceFirst = (data?.schemes?.priceFirst || [])
        tf = timeFirst[0]
        pf = priceFirst[0]

        if ((!tf && !pf)) {
          try {
            const og = await api.get('/amap/geo', { params: { address: `${q.origin}市`, city: q.origin } })
            const dg = await api.get('/amap/geo', { params: { address: `${q.destination}市`, city: q.destination } })
            const oloc = og.data?.data?.geocodes?.[0]?.location || ''
            const dloc = dg.data?.data?.geocodes?.[0]?.location || ''
            if (oloc && dloc) {
              const tr = await api.get('/amap/transit', { params: { from: oloc, to: dloc, city: q.origin, cityd: q.destination } })
              const trans = tr.data?.data?.route?.transits || []
              const items = trans.map((t: any) => ({ dur: Number(t.duration || 0), cost: Number(t.cost || 0) }))
                .filter((x: any) => Number.isFinite(x.dur) && Number.isFinite(x.cost) && x.dur > 0 && x.cost >= 0)
              if (items.length > 0) {
                const timeBest = [...items].sort((a, b) => a.dur - b.dur)[0]
                const priceBest = [...items].sort((a, b) => a.cost - b.cost)[0]
                (data.schemes ||= {})
                data.schemes.timeFirst = [{ title: '时间优先', totalTimeMinutes: Math.round(timeBest.dur / 60), totalPrice: timeBest.cost, transfers: 1, segments: [] }]
                data.schemes.priceFirst = [{ title: '价格优先', totalTimeMinutes: Math.round(priceBest.dur / 60), totalPrice: priceBest.cost, transfers: 2, segments: [] }]
              }
            }
          } catch {}
        }

        const tfHtml = tf && !wantPriceOnly ? `
          <div class="scheme card-time">
            <div class="scheme-title"><span class="icon">🕒</span>时间最优解</div>
            <ul class="kv">
              <li><span class="badge">总时长</span>${Number(tf.totalTimeMinutes)} 分钟</li>
              <li><span class="badge">总价格</span>￥${Number(tf.totalPrice)}</li>
              <li><span class="badge">换乘</span>${Number(tf.transfers)} 次</li>
            </ul>
            <div class="bars">
              <div class="bar-track"><div class="bar-fill-time" style="width:${tfTimePct}%"></div></div>
              <div class="bar-track"><div class="bar-fill-price" style="width:${tfPricePct}%"></div></div>
            </div>
            <ul class="segments-list">
              ${segmentsHtml(tf)}
            </ul>
            <div><span class="badge">风险提示</span>${riskNotes(tf)}</div>
          </div>
        ` : ''

        const pfHtml = pf ? `
          <div class="scheme card-price">
            <div class="scheme-title"><span class="icon">￥</span>价格最优解</div>
            <ul class="kv">
              <li><span class="badge">总时长</span>${Number(pf.totalTimeMinutes)} 分钟</li>
              <li><span class="badge">总价格</span>￥${Number(pf.totalPrice)}</li>
              <li><span class="badge">换乘</span>${Number(pf.transfers)} 次</li>
            </ul>
            <div class="bars">
              <div class="bar-track"><div class="bar-fill-time" style="width:${pfTimePct}%"></div></div>
              <div class="bar-track"><div class="bar-fill-price" style="width:${pfPricePct}%"></div></div>
            </div>
            <ul class="segments-list">
              ${segmentsHtml(pf)}
            </ul>
            <div><span class="badge">风险提示</span>${riskNotes(pf)}</div>
          </div>
        ` : `<div class="scheme card-price"><div class="scheme-title"><span class="icon">￥</span>价格最优解</div><div>无价格最优数据（请更换日期或放宽约束）</div></div>`

        const banner = flightsDb.length === 0 ? `<div class="scheme-title"><span class="icon">✈️</span>航班数据缺失（近十天或条件不匹配）</div>` : ''
        const html = `
          <div class="section-title">问题：${q.origin} → ${q.destination}（日期 ${q.date}）</div>
          ${banner}
          ${tfHtml}
          ${pfHtml}
          <div class="section-title">航班数据（严格来源于数据库）</div>
          <div>${flightsHtml}</div>
          <div class="section-title">酒店推荐（评分优先）</div>
          <div>${hotelsHtml}</div>
        `
        queryCache.set(cacheKey, html)
        assistantText = html
        payloadForHistory = { request: { query: q, input: content }, response: { recommendations: data, compiled: c } }
      } else if (isCityIntent) {
        const city = isCityIntent
        const budgetMatch = content.match(/(\d{2,4})\s*左右|价格\s*在\s*(\d{2,4})/)
        const budgetMax = budgetMatch ? Number(budgetMatch[1] || budgetMatch[2]) : undefined
        const comp = await api.get('/compiled/recommendations', { params: { city, date: (useTravelStore().currentQuery?.departureDate || '2025-12-01'), budgetMax: budgetMax || 0, ratingMin: 3, interests: '美食', limit: 20 } })
        const c = comp.data || {}
        const h = (c?.recommendedHotels || []).slice(0, 3).map((x: any) => `${x.name} 评分${x.rating || '-'} 距离${x.distanceKm || '-'}km`).join('；')
        const routeDays = Array.isArray(c?.routes) && c.routes[0]?.dailyPlan ? c.routes[0].dailyPlan.length : 3
        assistantText = `${city}的${routeDays}日路线与酒店推荐：${budgetMax ? `预算上限￥${Number(budgetMax)}，` : ''}酒店（评分优先）${h || '暂无'}。每日路线请查看编排详情。`
        payloadForHistory = { request: { input: content }, response: { compiled: c } }
      } else {
        if (wantPriceOnly && messages.value.length > 0) {
          const last = messages.value.slice().reverse().find(m => m.role === 'assistant' && /问题：.+→.+（日期/.test(m.content))
          if (last) {
            const htmlOnlyPrice = last.content.replace(/<div class="scheme card-time">[\s\S]*?<\/div>/, '')
            assistantText = htmlOnlyPrice
            payloadForHistory = { request: { input: content }, response: { content: assistantText } }
            const assistantMessage: Message = { id: generateId(), content: assistantText, role: 'assistant', timestamp: new Date().toISOString(), type: 'text' }
            addMessage(assistantMessage)
            setLoading(false)
            return
          }
        }
        const r = await api.post('/llm/chat', { text: content })
        assistantText = String(r?.data?.content || '')
        payloadForHistory = { request: { input: content }, response: { content: assistantText } }
      }
      const assistantMessage: Message = { id: generateId(), content: assistantText, role: 'assistant', timestamp: new Date().toISOString(), type: 'text' }
      addMessage(assistantMessage)
      try {
        if (!auth.isGuest) {
          const title = extractTitle(content)
          const h = await api.post('/history', { title, ...payloadForHistory })
          const hid = String(h?.data?.id || generateId())
          if (!currentConversation.value) {
            const newConversation: Conversation = { id: hid, title, messages: [userMessage, assistantMessage], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            addConversation(newConversation)
            setCurrentConversation(newConversation.id)
          }
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
      const auth = useAuthStore()
      if (auth.isGuest) {
        setError('游客模式不加载历史')
        setLoading(false)
        return
      }
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
      const auth = useAuthStore()
      if (!auth.isGuest) {
        const h = await api.post('/history', { title: newConv.title, request: {}, response: {} })
        const hid = String(h?.data?.id || newConv.id)
        newConv.id = hid
      }
    } catch {}
    addConversation(newConv)
    setCurrentConversation(newConv.id)
    setMessages([])
    setError(null)
    
    return newConv
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const auth = useAuthStore()
      if (!auth.isGuest) {
        await api.delete(`/history/${conversationId}`)
      }
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