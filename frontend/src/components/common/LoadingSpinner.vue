<template>
  <div class="loading-spinner" :class="{ inline: inline }">
    <el-icon class="spinner-icon" :size="size">
      <Loading />
    </el-icon>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

interface Props {
  size?: number
  text?: string
  inline?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 20,
  text: '',
  inline: false
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
}

.loading-spinner.inline {
  display: inline-flex;
  padding: 0;
}

.spinner-icon {
  animation: spin 1s linear infinite;
  color: #409eff;
}

.loading-text {
  font-size: 14px;
  color: #666;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>