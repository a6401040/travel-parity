import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  withCredentials: true
})

api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    const msg = err?.response?.data?.message || err?.message || '请求失败'
    return Promise.reject(new Error(msg))
  }
)

export default api