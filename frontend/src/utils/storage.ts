// 本地存储工具函数
export const storage = {
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      if (item === null) {
        return defaultValue ?? null
      }
      
      // 尝试解析JSON，如果失败则直接返回字符串值
      try {
        return JSON.parse(item)
      } catch (parseError) {
        // 如果不是有效的JSON，直接返回字符串值
        return item as unknown as T
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return defaultValue ?? null
    }
  },

  // 专门处理字符串类型的get方法
  getString(key: string, defaultValue?: string): string | null {
    try {
      const item = localStorage.getItem(key)
      return item ?? defaultValue ?? null
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return defaultValue ?? null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  },

  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  },

  exists(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null
    } catch (error) {
      console.error(`Error checking localStorage key "${key}":`, error)
      return false
    }
  }
}

// Session存储工具函数
export const sessionStorage = {
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = window.sessionStorage.getItem(key)
      if (item === null) {
        return defaultValue ?? null
      }
      
      // 尝试解析JSON，如果失败则直接返回字符串值
      try {
        return JSON.parse(item)
      } catch (parseError) {
        // 如果不是有效的JSON，直接返回字符串值
        return item as unknown as T
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error)
      return defaultValue ?? null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error)
    }
  },

  remove(key: string): void {
    try {
      window.sessionStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error)
    }
  },

  clear(): void {
    try {
      window.sessionStorage.clear()
    } catch (error) {
      console.error('Error clearing sessionStorage:', error)
    }
  },

  exists(key: string): boolean {
    try {
      return window.sessionStorage.getItem(key) !== null
    } catch (error) {
      console.error(`Error checking sessionStorage key "${key}":`, error)
      return false
    }
  }
}