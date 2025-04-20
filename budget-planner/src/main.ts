import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

/* Import Font Awesome core and CSS */
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import { 
  faUser, 
  faCamera, 
  faSignOutAlt, 
  faTimes,
  faSpinner,
  faArrowRightFromBracket,
  faXmark,
  faChartPie,
  faExchangeAlt,
  faTag,
  faChevronLeft,
  faPlus,
  faWallet,
  faArrowUp,
  faArrowDown,
  faReceipt,
  faMoneyBillWave,
  faChartLine,
  faCalendar
} from '@fortawesome/free-solid-svg-icons'

// Prevent Font Awesome from auto-replacing <i> tags
config.autoReplaceSvg = false
config.styleDefault = 'solid'

/* Add icons to the library */
library.add(
  faUser,
  faCamera,
  faSignOutAlt,
  faTimes,
  faSpinner,
  faArrowRightFromBracket,
  faXmark,
  faChartPie,
  faExchangeAlt,
  faTag,
  faChevronLeft,
  faPlus,
  faWallet,
  faArrowUp,
  faArrowDown,
  faReceipt,
  faMoneyBillWave,
  faChartLine,
  faCalendar
)

const app = createApp(App)

app.use(createPinia())
app.use(router)

/* Register Font Awesome component globally */
app.component('FontAwesomeIcon', FontAwesomeIcon)

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
