<template>
  <div class="profile-edit-page bg-profile-edit">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">编辑个人信息</div>
    </header>
    <main class="center">
      <div class="form-card">
        <div class="form-title">编辑个人信息</div>
        
        <input 
          class="input" 
          placeholder="手机号"
          v-model="form.phone"
        />
        <div class="form-links">
          <button class="btn" @click="handleSubmit">保存</button>
          <router-link class="btn secondary" to="/settings/profile">取消</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  phone: ''
})

onMounted(() => {
  if (authStore.user) {
    form.phone = ''
  }
})

const handleSubmit = async () => {
  try {
    await authStore.updateProfile({
      phone: form.phone
    })
    
    ElMessage.success('个人资料更新成功！')
    router.push('/settings/profile')
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  }
}

const handleCancel = () => {
  router.push('/settings/profile')
}
</script>

<style scoped lang="scss">
.profile-edit-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.profile-edit-page::before {
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

.profile-edit-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.profile-edit-page > * {
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