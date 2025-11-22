<template>
  <div class="chat-layout">
    <AppHeader />
    <div class="chat-container">
      <aside class="sidebar">
        <HistorySidebar />
      </aside>
      <main class="chat-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
import HistorySidebar from '@/components/chat/HistorySidebar.vue'
</script>

<style scoped>
.chat-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 768px) {
  .sidebar {
    width: 240px;
  }
}

@media (max-width: 640px) {
  .chat-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
}
</style>