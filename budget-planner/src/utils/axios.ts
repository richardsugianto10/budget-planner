import axios from 'axios'
import API_CONFIG from '../config/api'

// Create axios instance with default config
const api = axios.create(API_CONFIG)

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add origin header
    config.headers['Origin'] = window.location.origin
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api 