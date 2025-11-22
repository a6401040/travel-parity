<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

onMounted(() => {
  // 从本地存储加载用户认证信息
  authStore.loadUserFromStorage()
  
  // 加载用户设置
  settingsStore.loadSettings()
  
  // 如果没有用户数据，设置一个默认的未认证状态
  if (!authStore.user) {
    authStore.setUser(null)
    authStore.setToken(null)
  }
})
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  body {
    color: #e0e0e0;
    background-color: #121212;
  }
  
  ::-webkit-scrollbar-track {
    background: #2a2a2a;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #555;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #666;
  }
}

body.dark {
  color: #e0e0e0;
  background-color: #121212;
}

body.dark ::-webkit-scrollbar-track {
  background: #2a2a2a;
}

body.dark ::-webkit-scrollbar-thumb {
  background: #555;
}

body.dark ::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>