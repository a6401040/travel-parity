<template>
  <div class="profile-page bg-profile">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">个人信息</div>
    </header>
    <main class="center">
      <div class="form-card">
        <div class="form-title">已注册信息</div>
        <ul class="display-list">
          <li><strong>显示名称：</strong>{{ userInfo.username }}</li>
          <li><strong>邮箱：</strong>{{ userInfo.email }}</li>
          <li><strong>注册时间：</strong>{{ formatDate(userInfo.createdAt) }}</li>
        </ul>
        <div class="form-links">
          <router-link class="btn" to="/settings/profile/edit">编辑信息</router-link>
          <router-link class="btn secondary" to="/settings">返回设置</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const userInfo = computed(() => authStore.user || {
  username: '未知用户',
  email: '未知邮箱',
  createdAt: new Date()
})

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped lang="scss">
.profile-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.profile-page::before {
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

.profile-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.profile-page > * {
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

.display-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
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
}

.btn.secondary {
  border-color: #888;
  color: #222;
  background: #eee;
}
</style>