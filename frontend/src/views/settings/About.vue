<template>
  <div class="about-page bg-about">
    <header class="hero">
      <div class="brand">出行助手</div>
      <div class="tag">项目说明与初衷</div>
    </header>
    <main class="center">
      <div class="form-card">
        <div class="form-title">说明</div>
        <ol>
          <li>整合铁路/航司/文旅数据与大模型，生成三类方案。</li>
          <li>遵循安全与最小化原则，提升用户体验与效率。</li>
          <li>范围：查询与推荐为主，跳转购票与下载功能辅助。</li>
        </ol>
        <div class="form-links">
          <router-link class="btn secondary" to="/settings">返回设置</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// About page component - matches prototype layout
</script>

<style scoped lang="scss">
.about-page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.about-page::before {
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

.about-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 0;
  pointer-events: none;
}

.about-page > * {
  position: relative;
  z-index: 1;
}

.hero { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.35); }
.form-title { color: #111; }
.form-links { color: #fff; }

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

ol {
  padding-left: 20px;
  margin: 0;
  display: grid;
  gap: 6px;
}

li {
  color: #555;
  line-height: 1.5;
}

.form-links {
  display: flex;
  gap: 8px;
  justify-content: center;
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
}

.btn.secondary {
  border-color: #888;
  color: #222;
  background: #eee;
}
</style>