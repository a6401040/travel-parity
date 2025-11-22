<template>
  <div class="subscribe-container">
    <div class="subscribe-header">
      <h1 class="subscribe-title">选择订阅计划</h1>
      <p class="subscribe-subtitle">选择最适合您需求的订阅方案</p>
      <div class="subscribe-actions">
        <el-button type="primary" size="small" @click="goToChat">返回对话</el-button>
      </div>
    </div>
    
    <div class="subscription-plans">
      <div class="plan-card">
        <div class="plan-header">
          <h3 class="plan-name">基础版</h3>
          <div class="plan-price">
            <span class="price">免费</span>
          </div>
        </div>
        
        <div class="plan-features">
          <ul class="feature-list">
            <li class="feature-item">
              <el-icon class="feature-icon"><Check /></el-icon>
              <span>每月10次对话</span>
            </li>
            <li class="feature-item">
              <el-icon class="feature-icon"><Check /></el-icon>
              <span>基础出行方案</span>
            </li>
            <li class="feature-item">
              <el-icon class="feature-icon"><Check /></el-icon>
              <span>标准客服支持</span>
            </li>
          </ul>
        </div>
        
        <div class="plan-action">
          <el-button 
            type="info" 
            size="large" 
            class="plan-button"
            :disabled="currentPlan === 'basic'"
          >
            {{ currentPlan === 'basic' ? '当前计划' : '选择基础版' }}
          </el-button>
        </div>
      </div>
      
      <div class="plan-card featured">
        <div class="plan-badge">推荐</div>
        <div class="plan-header">
          <h3 class="plan-name">15元</h3>
          <div class="plan-price">
            <span class="price">¥15</span>
            <span class="price-period">/月</span>
          </div>
        </div>
        
        <div class="plan-features">
          <ol class="feature-list">
            <li class="feature-item">
              <span>每日 50 次生成</span>
            </li>
            <li class="feature-item">
              <span>支持 JSON/Markdown 导出</span>
            </li>
            <li class="feature-item">
              <span>PDF 显示占位提示</span>
            </li>
            <li class="feature-item">
              <span>会话持久化</span>
            </li>
            <li class="feature-item">
              <span>历史/收藏各 200 条</span>
            </li>
            <li class="feature-item">
              <span>较高优先级</span>
            </li>
          </ol>
        </div>
        
        <div class="plan-action">
          <el-button 
            type="primary" 
            size="large" 
            class="plan-button"
            @click="subscribePro"
            :disabled="currentPlan === 'pro'"
          >
            {{ currentPlan === 'pro' ? '当前计划' : '选择15元版' }}
          </el-button>
        </div>
      </div>
      
      <div class="plan-card">
        <div class="plan-header">
          <h3 class="plan-name">25元</h3>
          <div class="plan-price">
            <span class="price">¥25</span>
            <span class="price-period">/月</span>
          </div>
        </div>
        
        <div class="plan-features">
          <ol class="feature-list">
            <li class="feature-item">
              <span>每日 200 次生成</span>
            </li>
            <li class="feature-item">
              <span>支持 JSON/Markdown/PDF 导出</span>
            </li>
            <li class="feature-item">
              <span>会话持久化</span>
            </li>
            <li class="feature-item">
              <span>历史/收藏各 1000 条</span>
            </li>
            <li class="feature-item">
              <span>高优先级与更快响应</span>
            </li>
          </ol>
        </div>
        
        <div class="plan-action">
          <el-button 
            type="info" 
            size="large" 
            class="plan-button"
            @click="subscribeEnterprise"
            :disabled="currentPlan === 'enterprise'"
          >
            {{ currentPlan === 'enterprise' ? '当前计划' : '选择25元版' }}
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="subscribe-note">
      <p class="note-text">
        <el-icon><InfoFilled /></el-icon>
        专业版和企业版支持随时取消，取消后将在当前计费周期结束后停止服务。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, InfoFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const currentPlan = ref<'basic' | 'pro' | 'enterprise'>('basic')

const subscribePro = () => {
  ElMessageBox.confirm(
    '确定要订阅专业版吗？每月费用为¥29。',
    '确认订阅',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 模拟订阅处理
    ElMessage.success('订阅专业版成功！')
    currentPlan.value = 'pro'
    authStore.updateSubscription('pro')
  }).catch(() => {
    ElMessage.info('已取消订阅')
  })
}

const subscribeEnterprise = () => {
  ElMessageBox.confirm(
    '确定要订阅企业版吗？每月费用为¥99。',
    '确认订阅',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 模拟订阅处理
    ElMessage.success('订阅企业版成功！')
    currentPlan.value = 'enterprise'
    authStore.updateSubscription('enterprise')
  }).catch(() => {
    ElMessage.info('已取消订阅')
  })
}

const goToChat = () => {
  router.push({ name: 'Chat' })
}
</script>

<style scoped lang="scss">
.subscribe-container {
  position: relative;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.subscribe-container::before {
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

.subscribe-container::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.subscribe-container > * {
  position: relative;
  z-index: 1;
}

.subscribe-header {
  text-align: center;
  margin-bottom: 3rem;
  color: #fff;
}

.subscribe-actions {
  margin-top: 1rem;
}

.subscribe-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.subscribe-subtitle {
  font-size: 1.125rem;
  color: #e5e7eb;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

.subscription-plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.plan-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
  }
  
  &.featured {
    border-color: #3b82f6;
    transform: scale(1.05);
    
    &:hover {
      transform: scale(1.05) translateY(-4px);
    }
  }
}

.plan-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: white;
  padding: 0.25rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.plan-header {
  text-align: center;
  margin-bottom: 2rem;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.plan-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}

.price {
  font-size: 2.5rem;
  font-weight: 700;
  color: #3b82f6;
}

.price-period {
  font-size: 1rem;
  color: #6b7280;
}

.plan-features {
  margin-bottom: 2rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: #374151;
}

.feature-icon {
  color: #10b981;
  flex-shrink: 0;
}

.plan-action {
  text-align: center;
}

.plan-button {
  width: 100%;
  font-weight: 600;
}

.subscribe-note {
  text-align: center;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 1rem;
}

.note-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 768px) {
  .subscribe-container {
    padding: 1rem;
  }
  
  .subscribe-title {
    font-size: 2rem;
  }
  
  .subscription-plans {
    grid-template-columns: 1fr;
  }
  
  .plan-card.featured {
    transform: none;
    
    &:hover {
      transform: translateY(-4px);
    }
  }
}
</style>