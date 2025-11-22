<template>
  <footer class="app-footer">
    <div class="footer-content">
      <p class="footer-text">&copy; 2024 出行助手. 智能出行，轻松规划.</p>
      <div class="footer-links">
        <el-link type="info" href="/settings/about">关于我们</el-link>
        <el-link type="info" href="/settings">设置</el-link>
        <el-link type="info" href="#">帮助</el-link>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 20px;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-text {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 16px;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-links {
    justify-content: center;
  }
}
</style>