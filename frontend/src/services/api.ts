import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    // الحساب عُطِّل أثناء الجلسة — نُنهي الجلسة محلياً بدل ترك واجهة معطوبة.
    // نتحقق من العلامة تحديداً حتى لا نطرد من حُجب لسبب آخر (كعقد الكفالة)،
    // ونستثني /login لأن رسالته تُعرض في الشاشة نفسها ولا يصح أن يبتلعها التحويل.
    const isLoginRequest = (error.config?.url ?? '').includes('/login')
    if (error.response?.status === 403 && error.response?.data?.account_disabled && !isLoginRequest) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
