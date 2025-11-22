<template>
  <div class="register-layout">
    <div class="left-pane">
      <div class="brand-top">
        <div class="brand-icon">🧭</div>
        <h1 class="brand-title">出行助手</h1>
      </div>
      <div class="slogan">
        让每一次出行都轻松愉快
      </div>
      <div class="features">
        <div class="feature-item">
          <div class="fi-icon">🗺️</div>
          <div>
            <div class="fi-title">智能路线规划</div>
            <div class="fi-desc">根据偏好与路况规划最佳路线</div>
          </div>
        </div>
        <div class="feature-item">
          <div class="fi-icon">🚇</div>
          <div>
            <div class="fi-title">公共交通信息</div>
            <div class="fi-desc">实时公交地铁到站信息</div>
          </div>
        </div>
        <div class="feature-item">
          <div class="fi-icon">📷</div>
          <div>
            <div class="fi-title">景点推荐</div>
            <div class="fi-desc">个性化周边热门景点推荐</div>
          </div>
        </div>
      </div>
      <div class="visual">
        <img src="https://design.gemcoder.com/staticResource/echoAiSystemImages/f30e8fd2ed398925023fb2f41b913a8f.png" alt="城市交通"/>
      </div>
    </div>

    <div class="right-pane">
      <div class="form-card">
        <h2 class="form-title">创建新账号</h2>
        <p class="form-subtitle">已有账号？
          <router-link :to="{ name: 'Login' }" class="link">立即登录</router-link>
        </p>
        <RegisterForm @success="handleRegisterSuccess" />
        <div class="skip-area">
          <router-link :to="{ name: 'Home' }" class="skip-link">暂时跳过</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import RegisterForm from '@/components/user/RegisterForm.vue'

const router = useRouter()

const handleRegisterSuccess = () => {
  ElMessage.success('注册成功！')
  router.push('/auth/login')
}
</script>

<style scoped lang="scss">
.register-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.left-pane {
  padding: 2rem;
  background: linear-gradient(135deg, #165DFF 0%, #0A46D4 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  justify-content: center;
}

.brand-top {
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

.slogan { font-size: 24px; font-weight: 700; }

.features { display: grid; gap: 1rem; }

.feature-item { display: flex; align-items: center; gap: 0.75rem; }

.fi-icon { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; }

.fi-title { font-weight: 600; }

.fi-desc { font-size: 12px; opacity: 0.85; }

.visual img { width: 100%; border-radius: 16px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.2); }

.right-pane {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f5f7fa;
  height: 100vh;
  box-sizing: border-box;
}

.form-card {
  width: 480px;
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin: 0 auto;
}

.form-title { font-weight: 700; font-size: 22px; color: #1f2937; margin: 0; }

.form-subtitle { color: #6b7280; margin: 6px 0 16px; }

.form-subtitle .link { color: #165DFF; text-decoration: none; margin-left: 6px; }

.skip-area { margin-top: 8px; text-align: center; }
.skip-link { color: #6b7280; text-decoration: none; }
.skip-link:hover { color: #374151; }

@media (max-width: 900px) {
  .register-layout { grid-template-columns: 1fr; }
  .left-pane { display: none; }
  .form-card { width: 100%; max-width: 520px; }
}
</style>