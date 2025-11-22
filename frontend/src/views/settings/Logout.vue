<template>
  <div class="logout-page bg-logout">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">退出登录</div>
    </header>
    <main class="center">
      <div class="form-card">
        <div class="form-title">退出登录</div>
        <div class="settings-about">确认退出当前账号？</div>
        <div class="form-links">
          <button class="btn" @click="handleLogout">确认退出</button>
          <router-link class="btn secondary" to="/settings">取消</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  // 执行退出登录
  authStore.logout()
  
  ElMessage.success('已成功退出登录')
  
  // 跳转到登录页面
  setTimeout(() => {
    router.push('/auth/login')
  }, 1000)
}
</script>

<style scoped lang="scss">
.logout-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.logout-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/bg/u=4239833843,3906688363&fm=3074&app=3074&f=PNG.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(12px);
  transform: scale(1.05);
  z-index: 0;
  pointer-events: none;
}

.logout-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.logout-page > * {
  position: relative;
  z-index: 1;
}

.hero { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.35); }

.center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.form-card {
  width: 360px;
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 16px;
  display: grid;
  gap: 10px;
}

.form-title {
  font-weight: 600;
  font-size: 16px;
}

.settings-about {
  color: #555;
  text-align: center;
}

.form-links {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.btn {
  padding: 6px 10px;
  border: 1px solid #2f80ed;
  color: #fff;
  background: #2f80ed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
  text-align: center;
  flex: 1;
}

.btn.secondary {
  border-color: #888;
  color: #222;
  background: #eee;
}
</style>