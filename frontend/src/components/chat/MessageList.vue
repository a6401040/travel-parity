<template>
  <div class="message-list" ref="messageListRef">
    <div v-if="!hasMessages" class="empty-chat">
      <div class="welcome-message">
        <img src="/bg/u=4239833843,3906688363&fm=3074&app=3074&f=PNG.png" alt="Welcome" class="welcome-image" />
        <h2 class="welcome-title">欢迎使用出行助手</h2>
        <p class="welcome-text">我是您的智能出行规划助手，可以帮助您：</p>
        <ul class="welcome-features">
          <li>🚄 规划最优出行路线</li>
          <li>🏨 推荐优质酒店</li>
          <li>📅 制定旅游行程</li>
          <li>💰 比较价格和时长</li>
        </ul>
        <p class="welcome-tip">请在下方的输入框中告诉我您的出行需求</p>
      </div>
    </div>
    
    <div v-else class="messages-container">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-item"
        :class="message.role"
      >
        <div class="message-avatar">
          <el-icon v-if="message.role === 'assistant'" class="assistant-avatar">
            <ChatDotRound />
          </el-icon>
          <el-icon v-else class="user-avatar">
            <User />
          </el-icon>
        </div>
        
        <div class="message-content">
          <div class="message-header">
            <span class="message-role">{{ message.role === 'assistant' ? '助手' : '我' }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          
          <div class="message-body">
            <div v-if="message.type === 'text'" class="text-message">
              {{ message.content }}
            </div>
            
            <div v-else-if="message.type === 'scheme'" class="scheme-message">
              <TravelSchemeCard 
                v-if="message.data && 'type' in message.data"
                :scheme="message.data" 
              />
            </div>
            
            <div v-else-if="message.type === 'hotel'" class="hotel-message">
              <HotelCard 
                v-if="message.data && 'rating' in message.data"
                :hotel="message.data" 
              />
            </div>
            
            <div v-else-if="message.type === 'route'" class="route-message">
              <RouteCard 
                v-if="message.data && 'duration' in message.data"
                :route="message.data" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="chatStore.isLoading" class="typing-indicator">
      <LoadingSpinner text="助手正在思考..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUpdated, ref } from 'vue'
import { ChatDotRound, User } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TravelSchemeCard from '@/components/travel/TravelSchemeCard.vue'
import HotelCard from '@/components/travel/HotelCard.vue'
import RouteCard from '@/components/travel/RouteCard.vue'
import { getRelativeTime } from '@/utils/date'

const chatStore = useChatStore()
const messageListRef = ref<HTMLElement>()

const messages = computed(() => chatStore.currentMessages)
const hasMessages = computed(() => messages.value.length > 0)

const formatTime = (timestamp: string) => {
  return getRelativeTime(timestamp)
}

// 自动滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

onUpdated(() => {
  scrollToBottom()
})
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
}

.empty-chat {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-message {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-image {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  border-radius: 50%;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.welcome-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 20px 0;
}

.welcome-features {
  text-align: left;
  margin: 0 0 20px 0;
  padding-left: 20px;
}

.welcome-features li {
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}

.welcome-tip {
  font-size: 14px;
  color: #409eff;
  font-style: italic;
  margin: 0;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.assistant-avatar,
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.assistant-avatar {
  background: #409eff;
  color: white;
}

.user-avatar {
  background: #67c23a;
  color: white;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-item.user .message-content {
  text-align: right;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #999;
}

.message-item.user .message-header {
  flex-direction: row-reverse;
}

.message-role {
  font-weight: 500;
}

.message-body {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
}

.message-item.user .message-body {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.text-message {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.typing-indicator {
  display: flex;
  justify-content: center;
  padding: 20px;
}

@media (max-width: 768px) {
  .message-list {
    padding: 16px;
  }
  
  .message-content {
    max-width: 80%;
  }
  
  .welcome-message {
    padding: 24px;
  }
  
  .welcome-title {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .message-content {
    max-width: 85%;
  }
  
  .message-body {
    padding: 10px 14px;
  }
}
</style>