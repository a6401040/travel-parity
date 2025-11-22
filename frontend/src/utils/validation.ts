// 验证工具函数
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

export function validateTravelQuery(query: any): string[] {
  const errors: string[] = []
  
  if (!query.origin || query.origin.trim().length === 0) {
    errors.push('出发地不能为空')
  }
  
  if (!query.destination || query.destination.trim().length === 0) {
    errors.push('目的地不能为空')
  }
  
  if (!query.departureDate) {
    errors.push('出发日期不能为空')
  } else {
    const departureDate = new Date(query.departureDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (departureDate < today) {
      errors.push('出发日期不能早于今天')
    }
  }
  
  if (query.returnDate) {
    const departureDate = new Date(query.departureDate)
    const returnDate = new Date(query.returnDate)
    
    if (returnDate <= departureDate) {
      errors.push('返程日期必须晚于出发日期')
    }
  }
  
  if (!query.passengers || query.passengers < 1) {
    errors.push('乘客数量必须至少1人')
  }
  
  return errors
}