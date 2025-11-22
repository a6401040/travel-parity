<template>
  <div class="travel-scheme-card">
    <div class="scheme-header">
      <div class="scheme-type">
        <el-tag :type="typeColor" size="small">
          {{ typeText }}
        </el-tag>
      </div>
      <div class="scheme-actions">
        <el-button
          type="primary"
          size="small"
          @click="viewDetails"
          :icon="View"
        >
          查看详情
        </el-button>
        <el-button
          :type="isSaved ? 'warning' : 'default'"
          size="small"
          @click="toggleSave"
          :icon="Star"
          :loading="saving"
        >
          {{ isSaved ? '已收藏' : '收藏' }}
        </el-button>
      </div>
    </div>
    
    <div class="scheme-content">
      <h3 class="scheme-title">{{ scheme.title }}</h3>
      <p class="scheme-description">{{ scheme.description }}</p>
      
      <div class="scheme-stats">
        <div class="stat-item">
          <el-icon><Clock /></el-icon>
          <span>{{ formatDuration(scheme.totalDuration) }}</span>
        </div>
        <div class="stat-item">
          <el-icon><Money /></el-icon>
          <span>¥{{ formatPrice(scheme.totalPrice) }}</span>
        </div>
        <div class="stat-item">
          <el-icon><Location /></el-icon>
          <span>{{ scheme.destinations.length }}个目的地</span>
        </div>
      </div>
      
      <div class="destinations-preview">
        <div class="destination-tags">
          <el-tag
            v-for="destination in scheme.destinations.slice(0, 3)"
            :key="destination.id"
            size="small"
            class="destination-tag"
          >
            {{ destination.name }}
          </el-tag>
          <el-tag
            v-if="scheme.destinations.length > 3"
            size="small"
            type="info"
          >
            +{{ scheme.destinations.length - 3 }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <div class="scheme-footer">
      <div class="scheme-date">
        <el-icon><Calendar /></el-icon>
        <span>{{ formatDate(scheme.createdAt) }}</span>
      </div>
      <div class="scheme-rating" v-if="scheme.rating">
        <el-rate
          v-model="scheme.rating"
          disabled
          size="small"
        />
        <span class="rating-text">{{ scheme.rating }}/5</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Star, Clock, Money, Location, Calendar } from '@element-plus/icons-vue'
import type { TravelScheme } from '@/types/travel'

interface Props {
  scheme: TravelScheme
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [schemeId: string]
  unsave: [schemeId: string]
}>()

const router = useRouter()
const saving = ref(false)

const isSaved = computed(() => props.scheme.isSaved)

const typeColor = computed(() => {
  switch (props.scheme.type) {
    case 'time-priority':
      return 'success'
    case 'price-priority':
      return 'warning'
    case 'comprehensive':
      return 'primary'
    default:
      return 'info'
  }
})

const typeText = computed(() => {
  switch (props.scheme.type) {
    case 'time-priority':
      return '时间优先'
    case 'price-priority':
      return '价格优先'
    case 'comprehensive':
      return '综合推荐'
    default:
      return '推荐方案'
  }
})

const formatDuration = (duration: number) => {
  const days = Math.floor(duration / 24)
  const hours = duration % 24
  
  if (days > 0) {
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`
  }
  return `${hours}小时`
}

const formatPrice = (price: number) => {
  return price.toLocaleString('zh-CN')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const viewDetails = () => {
  router.push(`/schemes/${props.scheme.id}`)
}

const toggleSave = async () => {
  if (saving.value) return
  
  saving.value = true
  
  try {
    if (isSaved.value) {
      emit('unsave', props.scheme.id)
      ElMessage.success('已取消收藏')
    } else {
      emit('save', props.scheme.id)
      ElMessage.success('收藏成功')
    }
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.travel-scheme-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.15);
  }
}

.scheme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.scheme-actions {
  display: flex;
  gap: 0.5rem;
}

.scheme-content {
  margin-bottom: 1rem;
}

.scheme-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.scheme-description {
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.scheme-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  
  .el-icon {
    color: #9ca3af;
  }
}

.destinations-preview {
  margin-bottom: 1rem;
}

.destination-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.destination-tag {
  background: #f3f4f6;
  border: none;
  color: #374151;
}

.scheme-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.scheme-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  
  .el-icon {
    color: #9ca3af;
  }
}

.scheme-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-text {
  font-size: 0.875rem;
  color: #6b7280;
}

@media (max-width: 640px) {
  .scheme-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .scheme-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .scheme-stats {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .scheme-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>