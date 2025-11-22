<template>
  <div class="settings-page bg-settings">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">设置与账号管理</div>
      <div class="hero-actions">
        <el-button type="primary" size="small" @click="goToChat">返回对话</el-button>
      </div>
    </header>
    <main class="settings-center">
      <div class="settings-menu">
        <router-link class="settings-link" to="/settings/profile">个人信息</router-link>
        <router-link class="settings-link" to="/settings/download">下载设置</router-link>
        <router-link class="settings-link" to="/settings/about">项目说明与初衷</router-link>
        <router-link class="settings-link" to="/settings/password">修改密码</router-link>
        <router-link class="settings-link" to="/settings/logout">退出登录</router-link>
        <router-link class="settings-link danger" to="/settings/delete">注销账号</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToChat = () => {
  router.push({ name: 'Chat' })
}
</script>

<style scoped lang="scss">
.settings-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.settings-page::before {
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

.settings-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.settings-page > * {
  position: relative;
  z-index: 1;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.hero-actions {
  display: flex;
  gap: 8px;
}

.settings-center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.settings-menu {
  width: 460px;
  display: grid;
  gap: 10px;
}

.settings-link {
  display: block;
  text-align: center;
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  color: #222;
  text-decoration: none;
  font-weight: 600;
}

.settings-link:hover {
  background: #f7f9fc;
}

.settings-link.danger {
  border-color: #e74c3c;
  color: #e74c3c;
}
</style>
