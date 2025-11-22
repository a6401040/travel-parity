<template>
  <div class="password-page bg-password">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">修改密码</div>
    </header>
    <main class="center">
      <div class="form-card">
        <div class="form-title">修改密码</div>
        <input 
          class="input" 
          type="password" 
          placeholder="旧密码"
          v-model="form.oldPassword"
        />
        <input 
          class="input" 
          type="password" 
          placeholder="新密码"
          v-model="form.newPassword"
        />
        <input 
          class="input" 
          type="password" 
          placeholder="确认新密码"
          v-model="form.confirmPassword"
        />
        <div class="form-links">
          <button class="btn" @click="handleSubmit">保存</button>
          <router-link class="btn secondary" to="/settings">取消</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleSubmit = async () => {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    ElMessage.error('请填写所有密码字段')
    return
  }
  
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.error('新密码与确认密码不一致')
    return
  }
  
  if (form.newPassword.length < 6) {
    ElMessage.error('新密码长度至少6个字符')
    return
  }
  
  const result = await authStore.changePassword(form.oldPassword, form.newPassword)
  
  if (result.success) {
    ElMessage.success('密码修改成功！请重新登录')
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    await authStore.logout()
    router.push('/auth/login')
  } else {
    ElMessage.error(result.message || '密码修改失败')
  }
}
</script>

<style scoped lang="scss">
.password-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.password-page::before {
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

.password-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.password-page > * {
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