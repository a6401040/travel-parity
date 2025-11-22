<template>
  <div class="form-card">
      <h2 class="form-title">欢迎回来</h2>
      <p class="form-subtitle">请登录您的账户继续旅程</p>
      <LoginForm @success="handleLoginSuccess" />
      <div class="divider"><span>或使用以下方式登录</span></div>
      <div class="oauth-grid">
        <button class="oauth-btn">G</button>
        <button class="oauth-btn">f</button>
        <button class="oauth-btn"></button>
      </div>
      <div class="footer-link">
        还没有账户？
        <router-link :to="{ name: 'Register' }" class="link">立即注册</router-link>
      </div>
      <div class="skip-area">
        <router-link :to="{ name: 'Home' }" class="skip-link">暂时跳过</router-link>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoginForm from '@/components/user/LoginForm.vue'

const router = useRouter()

const handleLoginSuccess = () => {
  ElMessage.success('登录成功！')
  router.push('/')
}
</script>

<style scoped lang="scss">
.login-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.brand-section {
  padding: 2rem;
  background: linear-gradient(135deg, #165DFF 0%, #36CFC9 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  justify-content: center;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
}

.brand-subtitle {
  opacity: 0.9;
}

.brand-visual img {
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 10px 30px -5px rgba(0,0,0,0.2);
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.feature-card {
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-title {
  font-weight: 600;
}

.feature-desc {
  font-size: 12px;
  opacity: 0.85;
}

.form-pane {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f5f7fa;
  height: 100vh;
  box-sizing: border-box;
}

.form-card {
  width: 420px;
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin: 0 auto;
}

.form-title {
  font-weight: 700;
  font-size: 22px;
  color: #1f2937;
  margin: 0;
}

.form-subtitle {
  color: #6b7280;
  margin: 6px 0 16px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 16px 0;
  color: #6b7280;
  font-size: 13px;
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e6e8ec;
}

.oauth-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.oauth-btn {
  border: 1px solid #e6e8ec;
  border-radius: 8px;
  height: 40px;
  background: #fff;
  cursor: pointer;
}

.footer-link {
  margin-top: 16px;
  text-align: center;
  color: #6b7280;
}

.footer-link .link {
  color: #165DFF;
  text-decoration: none;
  margin-left: 6px;
}

.skip-area { margin-top: 8px; text-align: center; }
.skip-link { color: #6b7280; text-decoration: none; }
.skip-link:hover { color: #374151; }

@media (max-width: 900px) {
  .login-layout {
    grid-template-columns: 1fr;
  }
  .brand-section { display: none; }
  .form-card { width: 100%; max-width: 460px; }
}
</style>