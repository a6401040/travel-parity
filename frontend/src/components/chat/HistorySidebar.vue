<template>
  <div class="history-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">历史记录</h3>
      <el-button 
        type="primary" 
        size="small" 
        @click="newConversation"
        :icon="Plus"
      >
        新对话
      </el-button>
    </div>
    
    <div class="sidebar-content">
      <div v-if="chatStore.isLoading" class="loading-container">
        <LoadingSpinner text="加载中..." />
      </div>
      
      <div v-else-if="chatStore.error" class="error-container">
        <ErrorMessage 
          :message="chatStore.error" 
          type="warning"
          :actions="[{ text: '重试', handler: loadConversations }]"
        />
      </div>
      
      <div v-else-if="!chatStore.hasConversations" class="empty-container">
        <el-empty description="暂无历史记录" />
      </div>
      
      <div v-else class="conversation-list">
        <div
          v-for="conversation in chatStore.conversations"
          :key="conversation.id"
          class="conversation-item"
          :class="{ active: conversation.id === chatStore.currentConversation }"
          @click="selectConversation(conversation.id)"
        >
          <div class="conversation-header">
            <h4 class="conversation-title">{{ conversation.title }}</h4>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, conversation.id)">
              <el-button text :icon="MoreFilled" class="more-button" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename" :icon="Edit">重命名</el-dropdown-item>
                  <el-dropdown-item command="delete" :icon="Delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          
          <div v-if="conversation.summary" class="conversation-summary">
            <div class="summary-item">
              <span class="summary-label">路线:</span>
              <span class="summary-value">{{ conversation.summary?.origin }} → {{ conversation.summary?.destination }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">最低价:</span>
              <span class="summary-value">¥{{ conversation.summary?.lowestPrice }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">最短时长:</span>
              <span class="summary-value">{{ formatDuration(conversation.summary?.shortestDuration || 0) }}</span>
            </div>
          </div>
          
          <div class="conversation-time">
            {{ formatTime(conversation.updatedAt) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MoreFilled, Edit, Delete } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import { formatDuration, getRelativeTime } from '@/utils/date'

const chatStore = useChatStore()

onMounted(() => {
  loadConversations()
})

const loadConversations = async () => {
  // TODO: 实现加载会话列表API
  // 这里使用模拟数据
  const mockConversations = [
    {
      id: '1',
      title: '北京到上海出差',
      messages: [],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      summary: {
        origin: '北京',
        destination: '上海',
        lowestPrice: 680,
        shortestDuration: 180
      }
    },
    {
      id: '2',
      title: '广州到深圳旅游',
      messages: [],
      createdAt: '2024-01-14T15:00:00Z',
      updatedAt: '2024-01-14T15:45:00Z',
      summary: {
        origin: '广州',
        destination: '深圳',
        lowestPrice: 120,
        shortestDuration: 60
      }
    }
  ]
  
  chatStore.setConversations(mockConversations)
}

const selectConversation = (conversationId: string) => {
  chatStore.loadConversation(conversationId)
}

const newConversation = () => {
  chatStore.newConversation()
}

const handleCommand = (command: string, conversationId: string) => {
  switch (command) {
    case 'rename':
      handleRename(conversationId)
      break
    case 'delete':
      handleDelete(conversationId)
      break
  }
}

const handleRename = (conversationId: string) => {
  // TODO: 实现重命名功能
  ElMessage.info('重命名功能开发中...')
}

const handleDelete = (conversationId: string) => {
  ElMessageBox.confirm(
    '确定要删除这个对话吗？删除后无法恢复。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    chatStore.deleteConversation(conversationId)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 用户取消删除
  })
}

const formatTime = (timestamp: string) => {
  return getRelativeTime(timestamp)
}
</script>

<style scoped>
.history-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading-container,
.error-container,
.empty-container {
  padding: 32px 16px;
  text-align: center;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conversation-item {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.conversation-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.conversation-item.active {
  border-color: #409eff;
  background: #f0f7ff;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.conversation-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-button {
  padding: 4px;
  margin-left: 8px;
}

.conversation-summary {
  margin-bottom: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-bottom: 4px;
}

.summary-label {
  color: #999;
  flex-shrink: 0;
}

.summary-value {
  color: #333;
  font-weight: 500;
}

.conversation-time {
  font-size: 12px;
  color: #999;
  text-align: right;
}

@media (max-width: 640px) {
  .sidebar-header {
    padding: 12px;
  }
  
  .sidebar-content {
    padding: 12px;
  }
  
  .conversation-item {
    padding: 8px;
  }
}
</style>