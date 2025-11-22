<template>
  <div class="download-settings-page bg-download">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">下载设置</div>
    </header>
    <main class="center">
      <div class="form-card">
        <div class="form-title">下载目录与命名规则</div>
        <div class="settings-row">
          <span class="pill">当前目录：{{ downloadPathDisplay }}</span>
          <input class="input" v-model="downloadPath" placeholder="例如：Desktop 或 /Users/xxx/Downloads" />
        </div>
        <input 
          class="input" 
          v-model="fileNamePattern"
          placeholder="文件命名规则，如 <origin>-to-<destination>_<yyyyMMdd-HHmm>_<format>"
        />
        <div class="settings-row">
          <span class="pill">命名预览：{{ previewFileName }}</span>
        </div>
        <div class="form-links">
          <button class="btn" @click="saveSettings">保存</button>
          <router-link class="btn secondary" to="/settings">取消</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/services/http'
import { useRouter } from 'vue-router'

const fileNamePattern = ref('<origin>-to-<destination>_<yyyyMMdd-HHmm>_<format>')
const downloadPath = ref('Desktop')
const downloadPathDisplay = computed(() => downloadPath.value || 'Desktop')

const previewFileName = computed(() => {
  return 'Guangzhou-to-Baoding_20251201-1030_md'
})

const saveSettings = async () => {
  try {
    const verify = await api.post('/settings/download/verify', { path: downloadPath.value || 'Desktop' })
    if (!verify.data?.exists) {
      ElMessage.error('路径不存在，请检查后再保存')
      return
    }
    await api.put('/settings/download', {
      default_format: 'markdown',
      filename_rule: fileNamePattern.value,
      include_segments_detail: true,
      download_path: downloadPath.value || 'Desktop'
    })
    ElMessage.success('下载设置已保存！')
    router.push('/settings')
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  }
}

// 加载保存的设置
const loadSettings = async () => {
  try {
    const resp = await api.get('/settings/download')
    const d = resp.data || {}
    fileNamePattern.value = String(d.filename_rule || fileNamePattern.value)
    downloadPath.value = String(d.download_path || 'Desktop')
  } catch (e) {}
}

// 组件挂载时加载设置
loadSettings()
</script>

<style scoped lang="scss">
.download-settings-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.download-settings-page::before {
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

.download-settings-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.download-settings-page > * {
  position: relative;
  z-index: 1;
}

 .hero { color: #ffffff; text-shadow: none; }

.center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.form-card {
  width: 360px;
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 16px;
  display: grid;
  gap: 10px;
}

.form-title {
  font-weight: 600;
  font-size: 16px;
}

.settings-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.pill {
  display: inline-block;
  padding: 2px 8px;
  border: 1px solid #ddd;
  border-radius: 999px;
  font-size: 12px;
  color: #444;
  background: #f9fafb;
}

.input {
  padding: 10px;
  border: 1px solid #e6e8ec;
  border-radius: 10px;
  font-size: 14px;
  width: 100%;
}

.form-links {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.btn {
  padding: 6px 10px;
  border: 1px solid #2f80ed;
  color: #fff;
  background: #2f80ed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
  text-align: center;
  flex: 1;
}

.btn.secondary {
  border-color: #888;
  color: #222;
  background: #eee;
}
</style>
const router = useRouter()