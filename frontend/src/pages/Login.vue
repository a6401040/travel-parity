<template>
  <div class="login-page">
    <h2 class="page-title">用户登录</h2>
    <LoginForm />
  </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/user/LoginForm.vue'
</script>

<style scoped>
.login-page {
  padding: 32px 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin: 0 0 32px 0;
}

@media (max-width: 480px) {
  .login-page {
    padding: 24px 0;
  }
  
  .page-title {
    font-size: 20px;
    margin-bottom: 24px;
  }
}
</style>