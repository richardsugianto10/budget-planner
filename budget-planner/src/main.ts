import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import { FontAwesomeIcon } from './plugins/fontawesome'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)

// Initialize auth store
const authStore = useAuthStore()
authStore.init()

// Set up axios interceptor for 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.clearToken()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

app.mount('#app')
