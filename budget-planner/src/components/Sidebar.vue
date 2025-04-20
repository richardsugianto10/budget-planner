<template>
  <div class="sidebar" :class="{ 
    collapsed: isCollapsed,
    'mobile-open': isMobileOpen
  }">
    <div class="sidebar-content">
      <nav class="nav-menu">
        <router-link 
          to="/dashboard" 
          class="nav-item" 
          active-class="active"
          @click="handleNavigation"
        >
          <font-awesome-icon icon="chart-pie" />
          <span class="nav-text">Overview</span>
        </router-link>
        
        <router-link 
          to="/transactions" 
          class="nav-item" 
          active-class="active"
          @click="handleNavigation"
        >
          <font-awesome-icon icon="exchange-alt" />
          <span class="nav-text">Transactions</span>
        </router-link>
        
        <router-link 
          to="/categories" 
          class="nav-item" 
          active-class="active"
          @click="handleNavigation"
        >
          <font-awesome-icon icon="tag" />
          <span class="nav-text">Categories</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <button class="nav-item logout-button" @click="handleLogout">
          <font-awesome-icon icon="sign-out-alt" />
          <span class="nav-text">Logout</span>
        </button>
        
        <button class="collapse-button" @click="toggleSidebar">
          <font-awesome-icon :icon="isCollapsed ? 'chevron-right' : 'chevron-left'" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const isCollapsed = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const props = defineProps<{
  isMobileOpen: boolean
}>()

const emit = defineEmits(['update:collapsed', 'close-mobile'])

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
}

watch(isCollapsed, (newValue) => {
  emit('update:collapsed', newValue)
})

const handleLogout = async () => {
  emit('close-mobile')
  await authStore.logout()
  router.push('/login')
}

const handleNavigation = () => {
  emit('close-mobile')
}
</script>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 240px;
  background-color: white;
  border-right: 1px solid #e2e8f0;
  transition: transform 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  
  &.collapsed {
    width: 72px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    width: 240px !important;
    
    &.mobile-open {
      transform: translateX(0);
    }
  }
  
  .nav-item {
    padding: 0.75rem 1rem;
    
    .nav-link {
      font-size: 0.9rem;
      
      .icon {
        width: 1.25rem;
        height: 1.25rem;
        margin-right: 0.75rem;
      }
    }
  }
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 4rem;
}

.nav-menu {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: #4a5568;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: #f7fafc;
    color: #2d3748;
  }
  
  &.active {
    color: #667eea;
    background-color: #ebf4ff;
    
    &:hover {
      background-color: #ebf4ff;
    }
  }
}

.nav-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.sidebar-footer {
  padding: 1rem 0;
  border-top: 1px solid #e2e8f0;
  
  .logout-button {
    color: #e53e3e;
    
    &:hover {
      background-color: #fff5f5;
    }
  }
}

.collapse-button {
  width: 100%;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f7fafc;
    color: #2d3748;
  }
}
</style> 