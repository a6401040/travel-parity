<template>
  <div class="delete-account-page bg-delete">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">注销账号</div>
    </header>
    <main class="center">
      <div class="form-card">
        <div class="form-title">危险操作</div>
        <div class="settings-about">注销账号为不可恢复操作，需二次确认。请输入"确认注销"后继续。</div>
        <input 
          class="input" 
          placeholder="请输入 确认注销"
          v-model="confirmationText"
        />
        <div class="form-links">
          <button 
            class="btn" 
            @click="handleDeleteAccount"
            :disabled="!canDelete"
            style="border-color:#e74c3c; background:#e74c3c"
          >
            确认注销
          </button>
          <router-link class="btn secondary" to="/settings">取消</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const confirmationText = ref('')

const canDelete = computed(() => {
  return confirmationText.value === '确认注销'
})

const handleDeleteAccount = () => {
  if (!canDelete.value) return
  
  // 模拟删除账户操作
  authStore.logout()
  ElMessage.success('账户已成功删除')
  router.push('/auth/login')
}
</script>

<style scoped lang="scss">
.delete-account-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.delete-account-page::before {
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

.delete-account-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.delete-account-page > * {
  position: relative;
  z-index: 1;
}

.hero { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.35); }
.settings-about { color: #eee; text-shadow: 0 1px 2px rgba(0,0,0,0.25); }

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
  line-height: 1.5;
}

.input {
  padding: 10px;
  border: 1px solid #e6e8ec;
  border-radius: 10px;
  font-size: 14px;
  width: 100%;
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