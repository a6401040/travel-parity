import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Subscription } from '@/types/auth'
import api from '@/services/http'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const subscription = ref<Subscription | null>(null)
  const remainingQuota = ref<number>(0)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isGuest = computed(() => !token.value && !user.value)
  const hasActiveSubscription = computed(() => {
    if (!subscription.value) return false
    return new Date(subscription.value.expiresAt) > new Date()
  })

  // 方法
  const setUser = (userData: User | null) => {
    user.value = userData
  }

  const setToken = (tokenValue: string | null) => {
    token.value = tokenValue
    if (tokenValue) {
      localStorage.setItem('token', tokenValue)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setSubscription = (subscriptionData: Subscription | null) => {
    subscription.value = subscriptionData
  }

  const setRemainingQuota = (quota: number) => {
    remainingQuota.value = quota
  }

  const login = async (username: string, password: string) => {
    const resp = await api.post('/auth/login', { username, password })
    const data = resp.data
    setUser({ id: String(data.user?.id || ''), username: String(data.user?.username || '') })
    setToken(String(data.sid || ''))
  }

  const register = async (username: string, email: string, password: string) => {
    await api.post('/auth/register', { username, email, password })
    return { success: true, message: '注册成功' }
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    setUser(null)
    setToken(null)
    setSubscription(null)
    setRemainingQuota(0)
  }

  const updateProfile = async (profileData: Partial<User>) => {
    // TODO: 实现更新用户资料API调用
    if (user.value) {
      user.value = { ...user.value, ...profileData, updatedAt: new Date().toISOString() }
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await api.put('/settings/password', { currentPassword: oldPassword, newPassword })
      return { success: true, message: '密码修改成功' }
    } catch (e: any) {
      return { success: false, message: e?.message || '密码修改失败' }
    }
  }

  const updateSubscription = (plan: 'basic' | 'pro' | 'enterprise') => {
    // 更新订阅信息
    const plans = {
      basic: { id: 'basic', name: '基础版', price: 0, features: [], queryLimit: 10, expiresAt: '' },
      pro: { id: 'pro', name: '专业版', price: 29, features: ['无限查询'], queryLimit: -1, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
      enterprise: { id: 'enterprise', name: '企业版', price: 99, features: ['无限查询', 'API接入'], queryLimit: -1, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
    }
    
    setSubscription(plans[plan])
    setRemainingQuota(plan === 'basic' ? 10 : -1)
  }

  const loadUserFromStorage = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      // TODO: 使用token获取用户信息
      // 这里只是模拟数据
      const mockUser: User = {
        id: '1',
        username: 'user',
        email: 'user@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setUser(mockUser)
    }
  }

  return {
    // 状态
    user,
    token,
    subscription,
    remainingQuota,
    
    // 计算属性
    isAuthenticated,
    isGuest,
    hasActiveSubscription,
    
    // 方法
    setUser,
    setToken,
    setSubscription,
    setRemainingQuota,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateSubscription,
    loadUserFromStorage
  }
})