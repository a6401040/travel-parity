<template>
  <div class="home-page">
    <div class="chat-container">
      <MessageList />
      <MessageInput />
    </div>
  </div>
</template>

<script setup lang="ts">
import MessageList from '@/components/chat/MessageList.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
</script>

<style scoped>
.home-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>