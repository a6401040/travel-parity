<template>
  <div class="home-container">
    <div class="top-right-actions" v-if="!isAuthenticated">
      <el-button size="small" type="success" @click="goLogin">登录</el-button>
      <el-button size="small" type="warning" @click="goRegister">注册</el-button>
    </div>
    <div class="welcome-section">
      <h1 class="welcome-title">Travel Parity</h1>
      <p class="welcome-subtitle">时间与价格的平衡之旅</p>
      
      <div class="quick-actions">
        <el-button type="primary" size="large" @click="startChat">开始对话</el-button>
        <el-button size="large" @click="showHistory">
          查看历史
        </el-button>
      </div>
    </div>
    
    <div class="features-section">
      <h2 class="section-title">核心功能</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon size="32"><ChatDotRound /></el-icon>
          </div>
          <h3 class="feature-title">智能对话</h3>
          <p class="feature-description">通过自然语言对话，获取个性化出行建议</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon size="32"><MapLocation /></el-icon>
          </div>
          <h3 class="feature-title">路线规划</h3>
          <p class="feature-description">智能规划最优路线，节省时间和费用</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon size="32"><OfficeBuilding /></el-icon>
          </div>
          <h3 class="feature-title">住宿推荐</h3>
          <p class="feature-description">根据您的需求推荐合适的住宿方案</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon size="32"><Clock /></el-icon>
          </div>
          <h3 class="feature-title">时间管理</h3>
          <p class="feature-description">合理安排行程时间，充分利用每一天</p>
        </div>
      </div>
    </div>
    
    
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElIcon } from 'element-plus'
import { ChatDotRound, MapLocation, OfficeBuilding, Clock } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { useTravelStore } from '@/stores/travel'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const chatStore = useChatStore()
const travelStore = useTravelStore()
const authStore = useAuthStore()

// 统计模块已移除，无需计算统计数据
const isAuthenticated = computed(() => authStore.isAuthenticated)

const startChat = () => {
  router.push({
    path: '/chat',
    query: { autoStart: 'true' }
  })
}

const showHistory = () => {
  // 显示历史对话的逻辑
  router.push('/history')
}

const goLogin = () => {
  router.push('/auth/login')
}

const goRegister = () => {
  router.push('/auth/register')
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap');
.home-container {
  position: relative;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.top-right-actions {
  position: fixed;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 1000;
}

.home-container::before {
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

.home-container::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.home-container > * {
  position: relative;
  z-index: 1;
}

.welcome-section {
  text-align: center;
  margin-bottom: 4rem;
}

.welcome-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: 0.06em;
  font-family: 'Cinzel Decorative', serif;
  background: linear-gradient(90deg, #fff, #e5e7eb 60%, #ffd54f);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: #e5e7eb;
  margin-bottom: 2rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  letter-spacing: 0.04em;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2rem;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.feature-icon {
  color: #3b82f6;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.feature-description {
  color: #6b7280;
  line-height: 1.5;
}

/* 使用统计模块已删除 */

@media (max-width: 768px) {
  .home-container {
    padding: 1rem;
  }
  
  .welcome-title {
    font-size: 2.4rem;
  }
  
  .quick-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>