<template>
  <div class="history-container">
    <div class="history-header">
      <div class="header-left">
        <h2>历史记录</h2>
        <el-tag v-if="isGuest" type="warning" size="small">
          游客模式
        </el-tag>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索历史对话..."
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="danger" @click="clearHistory" :disabled="!hasHistory || isGuest">
          清空历史
        </el-button>
      </div>
    </div>
    
    <div class="history-content">
      <div v-if="!hasHistory" class="empty-state">
        <el-icon size="64"><Document /></el-icon>
        <h3>暂无历史记录</h3>
        <p>{{ isGuest ? '游客模式下的对话不会保存，登录后可保存历史记录' : '您的对话历史将在这里显示' }}</p>
        <div class="empty-actions">
          <el-button type="primary" @click="goToChat">
            开始对话
          </el-button>
          <el-button v-if="isGuest" type="warning" @click="goToLogin">
            登录保存历史
          </el-button>
        </div>
      </div>
      
      <div v-else class="history-list">
        <div v-for="conversation in filteredConversations" 
             :key="conversation.id"
             class="history-item"
             @click="openConversation(conversation)">
          <div class="item-header">
            <h4 class="conversation-title">{{ conversation.title }}</h4>
            <span class="message-count">{{ conversation.messageCount || conversation.messages.length }} 条消息</span>
          </div>
          
          <div class="item-preview">
            <p class="last-message">{{ conversation.lastMessage || '暂无消息' }}</p>
            <span class="update-time">{{ formatTime(conversation.updatedAt) }}</span>
          </div>
          
          <div class="item-actions">
            <el-button type="primary" link @click.stop="openConversation(conversation)">
              查看详情
            </el-button>
            <el-button type="danger" link @click.stop="deleteConversation(conversation)">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import type { Conversation } from '@/types/chat'

const router = useRouter()
const chatStore = useChatStore()
const authStore = useAuthStore()
const searchQuery = ref('')
const isGuest = computed(() => authStore.isGuest)

onMounted(() => {
  // 页面加载逻辑
})

const conversations = computed(() => chatStore.conversations)
const hasHistory = computed(() => conversations.value.length > 0)

const filteredConversations = computed(() => {
  if (!searchQuery.value) {
    return conversations.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return conversations.value.filter(conv => {
    const titleMatch = conv.title.toLowerCase().includes(query)
    const lastMessageMatch = conv.lastMessage ? conv.lastMessage.toLowerCase().includes(query) : false
    return titleMatch || lastMessageMatch
  })
})

const openConversation = (conversation: Conversation) => {
  chatStore.setCurrentConversation(conversation.id)
  router.push('/chat')
}

const deleteConversation = async (conversation: Conversation) => {
  // 游客模式限制
  if (isGuest.value) {
    ElMessage.warning('游客模式无法删除对话，请登录后使用')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这个对话吗？此操作无法撤销。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await chatStore.deleteConversation(conversation.id)
    ElMessage.success('对话已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const clearHistory = async () => {
  // 游客模式限制
  if (isGuest.value) {
    ElMessage.warning('游客模式无法清空历史记录，请登录后使用')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作无法撤销。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await chatStore.clearAllConversations()
    ElMessage.success('历史记录已清空')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败')
    }
  }
}

const goToChat = () => {
  router.push('/chat')
}

const goToLogin = () => {
  router.push('/auth/login')
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
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style scoped lang="scss">
.history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
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

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.history-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600px;
  color: #9ca3af;
  text-align: center;
  
  .el-icon {
    margin-bottom: 1rem;
  }
  
  h3 {
    margin: 0.5rem 0;
    color: #6b7280;
  }
  
  p {
    margin-bottom: 1.5rem;
    color: #9ca3af;
  }
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.history-list {
  padding: 1.5rem;
}

.history-item {
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.conversation-title {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.message-count {
  color: #6b7280;
  font-size: 0.875rem;
}

.item-preview {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.last-message {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  margin-right: 1rem;
}

.update-time {
  color: #9ca3af;
  font-size: 0.75rem;
  white-space: nowrap;
}

.item-actions {
  display: flex;
  gap: 1rem;
}

@media (max-width: 768px) {
  .history-container {
    padding: 1rem;
  }
  
  .history-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .item-preview {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .update-time {
    text-align: right;
  }
}
</style>