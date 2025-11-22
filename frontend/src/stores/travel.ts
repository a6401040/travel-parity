import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TravelQuery, TravelRecommendation, TravelScheme, Hotel, Route } from '@/types/travel'

export const useTravelStore = defineStore('travel', () => {
  // 状态
  const currentQuery = ref<TravelQuery | null>(null)
  const recommendations = ref<TravelRecommendation | null>(null)
  const hotels = ref<Hotel[]>([])
  const routes = ref<Route[]>([])
  const selectedScheme = ref<TravelScheme | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 计算属性
  const hasRecommendations = computed(() => !!recommendations.value)
  const schemes = computed(() => recommendations.value?.schemes || [])
  const recommendedHotels = computed(() => recommendations.value?.hotels || [])
  const recommendedRoutes = computed(() => recommendations.value?.routes || [])

  // 方法
  const setCurrentQuery = (query: TravelQuery | null) => {
    currentQuery.value = query
  }

  const setRecommendations = (rec: TravelRecommendation | null) => {
    recommendations.value = rec
  }

  const setHotels = (newHotels: Hotel[]) => {
    hotels.value = newHotels
  }

  const setRoutes = (newRoutes: Route[]) => {
    routes.value = newRoutes
  }

  const setSelectedScheme = (scheme: TravelScheme | null) => {
    selectedScheme.value = scheme
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const searchTravel = async (query: TravelQuery) => {
    setLoading(true)
    setError(null)
    setCurrentQuery(query)

    try {
      // TODO: 实现API调用
      // 模拟数据
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockRecommendations: TravelRecommendation = {
        query,
        schemes: [
          {
            id: '1',
            type: 'time-priority',
            totalPrice: 1280,
            totalDuration: 180,
            transferCount: 0,
            score: 4.8,
            description: '时间优先方案：最快到达，适合商务出行',
            segments: [
              {
                id: '1',
                type: 'flight',
                origin: query.origin,
                destination: query.destination,
                departureTime: '2024-01-15T08:00:00Z',
                arrivalTime: '2024-01-15T11:00:00Z',
                duration: 180,
                price: 1280,
                carrier: '中国国航',
                flightNumber: 'CA1234',
                seatClass: '经济舱'
              }
            ],
            riskTips: ['航班可能延误', '天气因素影响']
          },
          {
            id: '2',
            type: 'price-priority',
            totalPrice: 680,
            totalDuration: 360,
            transferCount: 1,
            score: 4.2,
            description: '价格优先方案：经济实惠，适合预算有限的旅客',
            segments: [
              {
                id: '2',
                type: 'train',
                origin: query.origin,
                destination: '中转站',
                departureTime: '2024-01-15T07:00:00Z',
                arrivalTime: '2024-01-15T10:00:00Z',
                duration: 180,
                price: 300,
                carrier: '中国铁路',
                trainNumber: 'G123',
                seatClass: '二等座'
              },
              {
                id: '3',
                type: 'train',
                origin: '中转站',
                destination: query.destination,
                departureTime: '2024-01-15T11:00:00Z',
                arrivalTime: '2024-01-15T13:00:00Z',
                duration: 120,
                price: 380,
                carrier: '中国铁路',
                trainNumber: 'D456',
                seatClass: '二等座'
              }
            ],
            riskTips: ['中转时间较长', '需要换乘']
          },
          {
            id: '3',
            type: 'comprehensive',
            totalPrice: 950,
            totalDuration: 240,
            transferCount: 0,
            score: 4.5,
            description: '综合优先方案：平衡时间和价格的最佳选择',
            segments: [
              {
                id: '4',
                type: 'flight',
                origin: query.origin,
                destination: query.destination,
                departureTime: '2024-01-15T14:00:00Z',
                arrivalTime: '2024-01-15T18:00:00Z',
                duration: 240,
                price: 950,
                carrier: '东方航空',
                flightNumber: 'MU5678',
                seatClass: '经济舱'
              }
            ],
            riskTips: ['价格适中', '时间合理']
          }
        ],
        hotels: [
          {
            id: '1',
            name: '豪华海景酒店',
            rating: 4.8,
            price: 588,
            location: '市中心海滨区',
            amenities: ['免费WiFi', '游泳池', '健身房', '海景房'],
            mapLink: '#'
          },
          {
            id: '2',
            name: '商务精选酒店',
            rating: 4.5,
            price: 388,
            location: '商务区核心',
            amenities: ['免费WiFi', '商务中心', '会议室', '接机服务'],
            mapLink: '#'
          }
        ],
        routes: [
          {
            id: '1',
            name: '经典三日游',
            duration: 3,
            totalPrice: 1200,
            difficulty: 'easy',
            dailyItinerary: [
              {
                day: 1,
                title: '城市观光',
                description: '参观主要景点，感受城市文化',
                attractions: ['历史博物馆', '中央公园', '老街区'],
                meals: ['酒店早餐', '特色午餐', '海鲜晚餐']
              },
              {
                day: 2,
                title: '自然风光',
                description: '探索自然景观，享受户外活动',
                attractions: ['国家森林公园', '湖景区', '观景台'],
                meals: ['酒店早餐', '野餐午餐', '山区晚餐']
              },
              {
                day: 3,
                title: '文化体验',
                description: '深度体验当地文化',
                attractions: ['艺术画廊', '手工艺品市场', '传统表演'],
                meals: ['酒店早餐', '街头小食', '告别晚餐']
              }
            ],
            mapLink: '#'
          }
        ]
      }

      setRecommendations(mockRecommendations)
      setHotels(mockRecommendations.hotels)
      setRoutes(mockRecommendations.routes)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索出行方案失败')
    } finally {
      setLoading(false)
    }
  }

  const bookScheme = async (scheme: TravelScheme) => {
    setSelectedScheme(scheme)
    // TODO: 实现预订API调用
    return { success: true, message: '预订成功', bookingId: generateId() }
  }

  const downloadRecommendations = async (format: 'json' | 'markdown' | 'pdf') => {
    if (!recommendations.value) {
      throw new Error('没有可下载的推荐数据')
    }

    try {
      // TODO: 实现下载API调用
      const data = JSON.stringify(recommendations.value, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `travel-recommendations-${Date.now()}.${format}`
      link.click()
      URL.revokeObjectURL(url)
      
      return { success: true, message: '下载成功' }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '下载失败')
    }
  }

  const saveScheme = (schemeId: string) => {
    if (recommendations.value) {
      const scheme = recommendations.value.schemes.find(s => s.id === schemeId)
      if (scheme) {
        scheme.isSaved = true
      }
    }
  }

  const unsaveScheme = (schemeId: string) => {
    if (recommendations.value) {
      const scheme = recommendations.value.schemes.find(s => s.id === schemeId)
      if (scheme) {
        scheme.isSaved = false
      }
    }
  }

  const loadMoreSchemes = async () => {
    // 模拟加载更多方案
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 添加更多模拟数据
      const moreSchemes: TravelScheme[] = [
        {
          id: '4',
          type: 'time-priority' as const,
          title: '快速直达方案',
          description: '最短时间到达目的地，适合商务出行',
          totalPrice: 1580,
          totalDuration: 120,
          transferCount: 0,
          score: 4.7,
          segments: [],
          destinations: [
            { id: '1', name: '北京', type: 'city' },
            { id: '2', name: '上海', type: 'city' }
          ],
          rating: 4.7,
          isSaved: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          type: 'price-priority' as const,
          title: '经济实惠方案',
          description: '最低成本出行，适合预算有限的旅客',
          totalPrice: 420,
          totalDuration: 480,
          transferCount: 1,
          score: 4.2,
          segments: [],
          destinations: [
            { id: '1', name: '北京', type: 'city' },
            { id: '3', name: '天津', type: 'city' }
          ],
          rating: 4.2,
          isSaved: false,
          createdAt: new Date().toISOString()
        }
      ]
      
      if (recommendations.value) {
        recommendations.value.schemes.push(...moreSchemes)
      } else {
        // 如果没有现有数据，创建新的推荐数据
        setRecommendations({
          query: currentQuery.value || {
            origin: '北京',
            destination: '上海',
            departureDate: new Date().toISOString().split('T')[0],
            returnDate: '',
            passengers: 1,
            travelType: 'one-way',
            budget: 2000,
            preferences: {}
          },
          schemes: moreSchemes,
          hotels: [],
          routes: []
        })
      }
    } catch (error) {
      throw new Error('加载更多方案失败')
    }
  }

  // 辅助函数
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  return {
    // 状态
    currentQuery,
    recommendations,
    hotels,
    routes,
    selectedScheme,
    isLoading,
    error,
    
    // 计算属性
    hasRecommendations,
    schemes,
    recommendedHotels,
    recommendedRoutes,
    
    // 方法
    setCurrentQuery,
    setRecommendations,
    setHotels,
    setRoutes,
    setSelectedScheme,
    setLoading,
    setError,
    searchTravel,
    bookScheme,
    downloadRecommendations,
    saveScheme,
    unsaveScheme,
    loadMoreSchemes
  }
})