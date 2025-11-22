import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Theme, Language } from '@/types/common'
import { storage } from '@/utils/storage'

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const downloadDirectory = ref<string>('~/Downloads')
  const namingPattern = ref<string>('travel-assistant-{date}')
  const theme = ref<Theme>('auto')
  const language = ref<Language>('zh-CN')

  // 方法
  const setDownloadDirectory = (directory: string) => {
    downloadDirectory.value = directory
    storage.set('downloadDirectory', directory)
  }

  const setNamingPattern = (pattern: string) => {
    namingPattern.value = pattern
    storage.set('namingPattern', pattern)
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    storage.set('theme', newTheme)
    applyTheme(newTheme)
  }

  const setLanguage = (newLanguage: Language) => {
    language.value = newLanguage
    storage.set('language', newLanguage)
    // TODO: 实现语言切换
  }

  const loadSettings = () => {
    const savedDownloadDirectory = storage.get<string>('downloadDirectory')
    const savedNamingPattern = storage.get<string>('namingPattern')
    const savedTheme = storage.getString('theme') as Theme | null
    const savedLanguage = storage.getString('language') as Language | null

    if (savedDownloadDirectory) downloadDirectory.value = savedDownloadDirectory
    if (savedNamingPattern) namingPattern.value = savedNamingPattern
    if (savedTheme) theme.value = savedTheme
    if (savedLanguage) language.value = savedLanguage

    applyTheme(theme.value)
  }

  const resetSettings = () => {
    setDownloadDirectory('~/Downloads')
    setNamingPattern('travel-assistant-{date}')
    setTheme('auto')
    setLanguage('zh-CN')
  }

  // 辅助函数
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else if (newTheme === 'light') {
      root.classList.remove('dark')
    } else {
      // auto模式，根据系统设置
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (theme.value === 'auto') {
        applyTheme('auto')
      }
    })
  }

  return {
    // 状态
    downloadDirectory,
    namingPattern,
    theme,
    language,
    
    // 方法
    setDownloadDirectory,
    setNamingPattern,
    setTheme,
    setLanguage,
    loadSettings,
    resetSettings
  }
})