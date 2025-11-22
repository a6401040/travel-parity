<template>
  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="app-title">出行助手</h1>
      </div>
      <div class="header-right">
        <div class="user-info" v-if="authStore.isAuthenticated">
          <span class="username">{{ authStore.user?.username }}</span>
          <el-dropdown @command="handleCommand">
            <el-button type="primary" circle>
              <el-icon><User /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item command="subscribe" divided>订阅管理</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="auth-buttons" v-else>
          <el-button @click="goToLogin">登录</el-button>
          <el-button type="primary" @click="goToRegister">注册</el-button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/settings/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'subscribe':
      router.push('/subscribe')
      break
    case 'logout':
      authStore.logout()
      router.push('/auth/login')
      break
  }
}

const goToLogin = () => {
  router.push('/auth/login')
}

const goToRegister = () => {
  router.push('/auth/register')
}
</script>

<style scoped>
.app-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  color: #666;
}

.auth-buttons {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
  }
  
  .app-title {
    font-size: 18px;
  }
}
</style>