<template>
  <div class="message-input">
    <div class="input-container">
      <el-input
        v-model="inputMessage"
        type="textarea"
        placeholder="请输入您的出行需求，例如：我想从北京到上海，明天出发..."
        :rows="3"
        :maxlength="500"
        show-word-limit
        @keydown="handleKeydown"
        :disabled="chatStore.isLoading"
        class="message-textarea"
      />
      
      <div class="input-actions">
        <div class="action-buttons">
          <el-button
            text
            :icon="Paperclip"
            @click="handleAttachment"
            :disabled="chatStore.isLoading"
            title="上传文件"
          />
          <el-button
            text
            :icon="Location"
            @click="handleLocation"
            :disabled="chatStore.isLoading"
            title="获取位置"
          />
        </div>
        
        <div class="send-buttons">
          <el-button
            type="primary"
            :icon="Promotion"
            @click="sendMessage"
            :loading="chatStore.isLoading"
            :disabled="!canSend"
            class="send-button"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
    
    <div v-if="authStore.subscription" class="quota-info">
      <el-text size="small" type="info">
        剩余查询次数: {{ authStore.remainingQuota }}
      </el-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Paperclip, Location, Promotion } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'

const chatStore = useChatStore()
const authStore = useAuthStore()

const inputMessage = ref('')

const canSend = computed(() => {
  return inputMessage.value.trim().length > 0 && !chatStore.isLoading
})

const sendMessage = async () => {
  if (!canSend.value) return
  
  if (authStore.remainingQuota <= 0) {
    ElMessage.warning('您的查询次数已用完，请升级订阅计划')
    return
  }
  
  const message = inputMessage.value.trim()
  inputMessage.value = ''
  
  try {
    await chatStore.sendMessage(message)
  } catch (error) {
    ElMessage.error('发送消息失败，请重试')
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleAttachment = () => {
  ElMessage.info('文件上传功能开发中...')
}

const handleLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        inputMessage.value = `我的位置是：纬度 ${latitude.toFixed(6)}, 经度 ${longitude.toFixed(6)}。`
        ElMessage.success('位置获取成功')
      },
      (error) => {
        ElMessage.error('获取位置失败，请检查权限设置')
      }
    )
  } else {
    ElMessage.error('您的浏览器不支持地理定位')
  }
}
</script>

<style scoped>
.message-input {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px;
}

.input-container {
  max-width: 800px;
  margin: 0 auto;
}

.message-textarea {
  margin-bottom: 12px;
}

.message-textarea :deep(.el-textarea__inner) {
  resize: none;
  font-family: inherit;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.send-buttons {
  display: flex;
  gap: 8px;
}

.send-button {
  min-width: 80px;
}

.quota-info {
  text-align: center;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .message-input {
    padding: 12px;
  }
  
  .input-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .send-buttons {
    justify-content: center;
  }
}
</style>