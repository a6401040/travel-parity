<template>
  <div class="error-message" :class="type">
    <el-icon class="error-icon">
      <Warning v-if="type === 'warning'" />
      <CircleClose v-else />
    </el-icon>
    <div class="error-content">
      <h4 v-if="title" class="error-title">{{ title }}</h4>
      <p class="error-text">{{ message }}</p>
      <div v-if="actions" class="error-actions">
        <el-button
          v-for="action in actions"
          :key="action.text"
          :type="action.type || 'primary'"
          :size="action.size || 'small'"
          @click="action.handler"
        >
          {{ action.text }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Warning, CircleClose } from '@element-plus/icons-vue'

interface Action {
  text: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'large' | 'default' | 'small'
  handler: () => void
}

interface Props {
  message: string
  title?: string
  type?: 'error' | 'warning'
  actions?: Action[]
}

withDefaults(defineProps<Props>(), {
  type: 'error',
  title: ''
})
</script>

<style scoped>
.error-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
}

.error-message.warning {
  background: #fdf6ec;
  border-color: #f5dab1;
}

.error-icon {
  color: #f56c6c;
  font-size: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

.error-message.warning .error-icon {
  color: #e6a23c;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
}

.error-text {
  font-size: 14px;
  color: #606266;
  margin: 0;
  line-height: 1.5;
}

.error-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style>