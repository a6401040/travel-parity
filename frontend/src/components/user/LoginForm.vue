<template>
  <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit">
    <el-form-item prop="username">
      <el-input
        v-model="form.username"
        placeholder="示例：demo_user"
        :prefix-icon="User"
        size="large"
      />
    </el-form-item>
    
    <el-form-item prop="password">
      <el-input
        v-model="form.password"
        type="password"
        placeholder="示例：pass1234"
        :prefix-icon="Lock"
        size="large"
        show-password
      />
    </el-form-item>
    
    <el-form-item>
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        :disabled="!canSubmit"
        @click="handleSubmit"
        class="submit-button"
      >
        登录
      </el-button>
    </el-form-item>
    
    <div class="form-footer">
      <el-link type="primary" @click="goToRegister">还没有账号？立即注册</el-link>
      <el-link type="info" @click="goToForgotPassword">忘记密码？</el-link>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { validateUsername } from '@/utils/validation'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref({
  username: 'demo_user',
  password: 'pass1234'
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { validator: validateUsernameRule, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const canSubmit = computed(() => {
  return form.value.username.trim() && form.value.password.trim() && !loading.value
})

function validateUsernameRule(rule: any, value: string, callback: any) {
  if (!validateUsername(value)) {
    callback(new Error('用户名只能包含字母、数字和下划线，长度3-20位'))
  } else {
    callback()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await authStore.login(form.value.username, form.value.password)
    
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message || '登录失败，请重试')
    } else {
      ElMessage.error('登录失败，请检查用户名和密码')
    }
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/auth/register')
}

const goToForgotPassword = () => {
  ElMessage.info('密码重置功能开发中...')
}
</script>

<style scoped>
.submit-button {
  width: 100%;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.form-footer .el-link {
  font-size: 14px;
}
</style>