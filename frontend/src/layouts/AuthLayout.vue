<template>
  <div class="auth-layout">
    <div class="auth-wrapper">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.auth-layout::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/bg/u=4239833843,3906688363&fm=3074&app=3074&f=PNG.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(12px);
  transform: scale(1.05);
}

.auth-layout::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
}

.auth-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 40px 32px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  width: 60px;
  height: 60px;
  margin-bottom: 16px;
}

.auth-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.auth-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 32px 24px;
  }
  
  .auth-title {
    font-size: 20px;
  }
}
</style>