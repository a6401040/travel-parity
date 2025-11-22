<template>
  <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit">
    <el-form-item prop="username">
      <el-input
        v-model="form.username"
        placeholder="用户名"
        :prefix-icon="User"
        size="large"
      />
    </el-form-item>
    
    <el-form-item prop="email">
      <el-input
        v-model="form.email"
        type="email"
        placeholder="邮箱地址"
        :prefix-icon="Message"
        size="large"
      />
    </el-form-item>
    
    <el-form-item prop="password">
      <el-input
        v-model="form.password"
        type="password"
        placeholder="密码"
        :prefix-icon="Lock"
        size="large"
        show-password
      />
    </el-form-item>
    
    <el-form-item prop="confirmPassword">
      <el-input
        v-model="form.confirmPassword"
        type="password"
        placeholder="确认密码"
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
        注册
      </el-button>
    </el-form-item>
    
    <div class="form-footer">
      <el-link type="primary" @click="goToLogin">已有账号？立即登录</el-link>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { validateUsername, validateEmail, validatePassword } from '@/utils/validation'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { validator: validateUsernameRule, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: validateEmailRule, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePasswordRule, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPasswordRule, trigger: 'blur' }
  ]
}

const canSubmit = computed(() => {
  return form.value.username.trim() && 
         form.value.email.trim() && 
         form.value.password.trim() && 
         form.value.confirmPassword.trim() && 
         !loading.value
})

function validateUsernameRule(rule: any, value: string, callback: any) {
  if (!validateUsername(value)) {
    callback(new Error('用户名只能包含字母、数字和下划线，长度3-20位'))
  } else {
    callback()
  }
}

function validateEmailRule(rule: any, value: string, callback: any) {
  if (!validateEmail(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

function validatePasswordRule(rule: any, value: string, callback: any) {
  const result = validatePassword(value)
  if (!result.valid) {
    callback(new Error(result.errors[0]))
  } else {
    callback()
  }
}

function validateConfirmPasswordRule(rule: any, value: string, callback: any) {
  if (value !== form.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const result = await authStore.register(
      form.value.username,
      form.value.email,
      form.value.password
    )
    
    if (result.success) {
      ElMessage.success('注册成功，请登录')
      router.push({ name: 'Login' })
    } else {
      ElMessage.error(result.message || '注册失败')
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message || '注册失败，请重试')
    } else {
      ElMessage.error('注册失败，请检查输入信息')
    }
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.submit-button {
  width: 100%;
}

.form-footer {
  text-align: center;
  margin-top: 16px;
}

.form-footer .el-link {
  font-size: 14px;
}
</style>