<template>
  <div class="chat-container">
  <div class="chat-header">
    <div class="header-left">
        <h2>智能对话</h2>
        <el-tag v-if="isTrae" type="success" size="small">Trae 友好</el-tag>
        <el-tag v-if="isGuest" type="warning" size="small">
          游客模式
        </el-tag>
      </div>
      <el-button type="primary" size="small" @click="newConversation">
        新对话
      </el-button>
    </div>
    
    <div class="chat-content">
      <div class="conversation-list">
        <div class="conversation-item" 
             v-for="conv in conversations" 
             :key="conv.id"
             :class="{ active: currentConversation === conv.id }"
             @click="selectConversation(conv)">
          <div class="conversation-title">{{ conv.title }}</div>
          <div class="conversation-time">{{ formatTime(conv.updatedAt) }}</div>
        </div>
        <div class="conversation-footer">
          <router-link :to="{ name: 'Settings' }" class="link">设置</router-link>
          <router-link :to="{ name: 'Subscribe' }" class="link">订阅计划</router-link>
          <router-link :to="{ name: 'Home' }" class="link">返回首页</router-link>
        </div>
      </div>
      
      <div class="chat-area">
        <div class="messages-container" ref="messagesContainer">
          <div v-if="!currentConversation" class="empty-state">
            <el-icon size="48"><ChatDotRound /></el-icon>
            <p>选择一个对话开始聊天，或创建新对话</p>
          </div>
          
          <div v-else-if="messages.length === 0" class="empty-state">
            <el-icon size="48"><ChatDotRound /></el-icon>
            <p>开始您的第一次对话吧！</p>
          </div>
          
          <div v-else class="messages-list">
            <div v-for="message in messages" 
                 :key="message.id"
                 :class="['message', message.role]">
              <div class="message-avatar" :class="message.role">
                <img class="avatar-img" :src="message.role === 'user' ? userAvatar : aiAvatar" alt="avatar" />
              </div>
              <div class="message-content">
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="currentConversationObj" class="input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入您的出行需求..."
            @keyup.enter.prevent="sendMessage"
            :disabled="isSending"
          />
          <el-button 
            type="primary" 
            @click="sendMessage"
            :loading="isSending"
            :disabled="!inputMessage.trim()">
            发送
          </el-button>
        </div>
        
        <!-- 游客模式登录提示 -->
        <div v-if="isGuest && currentConversationObj" class="guest-prompt">
          <el-alert
            title="游客模式"
            description="登录后可享受更多功能：保存对话历史、导出方案、个性化推荐等"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="guest-actions">
                <el-button type="primary" size="small" @click="goToLogin">
                  立即登录
                </el-button>
                <el-button size="small" @click="goToRegister">
                  注册账号
                </el-button>
              </div>
            </template>
          </el-alert>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, User } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import type { Conversation } from '@/types/chat'
import type { Message } from '@/types/travel'

const userAvatar = 'https://img.icons8.com/fluency/48/user-male-circle.png'
const aiAvatar = 'https://img.icons8.com/fluency/48/bot.png'

const chatStore = useChatStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const inputMessage = ref('')
const isSending = ref(false)
const messagesContainer = ref<HTMLElement>()

const conversations = computed(() => chatStore.conversations)
const currentConversation = computed(() => chatStore.currentConversation)
const currentConversationObj = computed(() => 
  conversations.value.find(conv => conv.id === currentConversation.value)
)
const messages = computed(() => chatStore.messages)
const isGuest = computed(() => authStore.isGuest)
const isTrae = computed(() => {
  const ua = navigator.userAgent || ''
  return ua.includes('Trae')
})

onMounted(() => {
  // 游客模式提示
  if (isGuest.value) {
    ElMessage.info('您正在以游客身份使用，部分功能可能受限')
  }
  
  // 处理自动开始会话
  handleAutoStart()
})

// 监听路由参数变化
watch(() => route.query.autoStart, (newVal) => {
  if (newVal === 'true') {
    handleAutoStart()
  }
})

const handleAutoStart = () => {
  // 如果URL参数包含autoStart=true，则自动开始会话
  if (route.query.autoStart === 'true') {
    // 如果有现有会话，选择最后一个会话
    if (conversations.value.length > 0) {
      const lastConversation = conversations.value[conversations.value.length - 1]
      chatStore.setCurrentConversation(lastConversation.id)
      ElMessage.success('已加载上次会话')
    } else {
      // 没有会话则创建新会话
      newConversation()
    }
    
    // 清除URL参数
    router.replace({ path: '/chat', query: {} })
  }
}

const selectConversation = (conversation: Conversation) => {
  chatStore.setCurrentConversation(conversation.id)
}

const newConversation = () => {
  // 游客模式检查
  if (isGuest.value && conversations.value.length >= 3) {
    ElMessage.warning('游客用户最多只能创建3个对话，请登录以获得更多功能')
    return
  }
  
  // 创建新对话
  chatStore.newConversation()
  ElMessage.success('已创建新对话')
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  
  // 游客模式检查
  if (isGuest.value && conversations.value.length >= 3) {
    ElMessage.warning('游客用户最多只能创建3个对话，请登录以获得更多功能')
    return
  }
  
  isSending.value = true
  try {
    await chatStore.sendMessage(inputMessage.value)
    inputMessage.value = ''
    scrollToBottom()
  } catch (error) {
    ElMessage.error('发送消息失败，请重试')
  } finally {
    isSending.value = false
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

const goToLogin = () => {
  router.push('/auth/login')
}

const goToRegister = () => {
  router.push('/auth/register')
}
</script>

<style scoped lang="scss">
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    color: #1f2937;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.conversation-list {
  width: 300px;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.conversation-item {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &.active {
    background-color: #eff6ff;
    border-left: 3px solid #3b82f6;
  }
}

.conversation-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.conversation-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.conversation-footer {
  margin-top: auto;
  padding: 0.75rem 1rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 0.5rem;
}

.conversation-footer .link {
  font-size: 0.875rem;
  color: #374151;
  text-decoration: none;
}

.conversation-footer .link:hover {
  color: #1f2937;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=60') center/cover no-repeat fixed;
  position: relative;
}

.chat-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(2px);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  
  .el-icon {
    margin-bottom: 1rem;
  }
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  
  &.user {
    flex-direction: row-reverse;
    
    .message-content {
      background-color: rgba(59, 130, 246, 0.7);
      color: #fff;
      backdrop-filter: blur(4px);
    }
  }
  
  &.assistant {
    .message-content {
      background-color: rgba(243, 244, 246, 0.7);
      color: #1f2937;
      backdrop-filter: blur(4px);
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  position: relative;
}

.message-text {
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-line;
}

.message-text.rich {
  white-space: normal;
}

.rich .section-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.rich .scheme-title {
  font-weight: 600;
  margin: 6px 0;
  color: #1f2937;
}

.rich .scheme.card-time {
  border-left: 4px solid #1d4ed8;
  background: #eef2ff;
  padding: 10px 12px;
  border-radius: 8px;
  margin: 8px 0;
}

.rich .scheme.card-price {
  border-left: 4px solid #059669;
  background: #ecfdf5;
  padding: 10px 12px;
  border-radius: 8px;
  margin: 8px 0;
}

.rich .scheme-title .icon {
  margin-right: 6px;
}

.rich ul.kv {
  list-style: none;
  padding: 0;
  margin: 0 0 6px 0;
}

.rich ul.kv li {
  margin: 2px 0;
}

.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
  background: #eef2ff;
  color: #1d4ed8;
  font-size: 12px;
  margin-right: 6px;
}

.segments-list {
  list-style: disc;
  margin: 4px 0 6px 16px;
}

.segment-item .code {
  font-weight: 600;
}
.segment-item .code.flight {
  color: #1d4ed8;
}
.segment-item .code.train {
  color: #059669;
}

.segment-item .time {
  color: #374151;
  margin-left: 6px;
}

.segment-item .price {
  color: #065f46;
  font-weight: 600;
  margin-left: 6px;
}
.segment-item .price.low { color: #059669; }
.segment-item .price.high { color: #dc2626; }
.segment-item .price.med { color: #374151; }

.segment-item a {
  margin-left: 6px;
  color: #2563eb;
  text-decoration: none;
}

.segment-item a:hover {
  text-decoration: underline;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

.input-area {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  position: relative;
  z-index: 1;
  
  .el-textarea {
    flex: 1;
  }
}

.guest-prompt {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: rgba(255, 251, 235, 0.8);
  backdrop-filter: blur(2px);
}

.guest-actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .conversation-list {
    width: 250px;
  }
  
  .message-content {
    max-width: 85%;
  }
  .badge { font-size: 11px; }
  .segments-list { margin-left: 14px; }
  .segment-item .time { font-size: 13px; }
  .segment-item .price { font-size: 13px; }
}

@media (max-width: 640px) {
  .chat-content {
    flex-direction: column;
  }
  
  .conversation-list {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .chat-header {
    padding: 1rem;
  }
  .message-content { padding: 0.5rem 0.75rem; }
  .message-text { font-size: 14px; }
}
</style>
.bars { display: grid; gap: 6px; margin: 8px 0; }
.bar-track { width: 100%; height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
.bar-fill-time { height: 100%; background: #3b82f6; }
.bar-fill-price { height: 100%; background: #10b981; }