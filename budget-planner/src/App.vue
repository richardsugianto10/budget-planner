<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Sidebar from '@/components/Sidebar.vue'
import ProfileMenu from './components/ProfileMenu.vue'

const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div class="app">
    <button 
      v-if="isAuthenticated"
      class="mobile-menu-button"
      :class="{ 'is-active': isMobileMenuOpen }"
      @click="toggleMobileMenu"
      aria-label="Toggle mobile menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <Sidebar 
      v-if="isAuthenticated" 
      :is-mobile-open="isMobileMenuOpen" 
      @close-mobile="closeMobileMenu" 
    />
    
    <main :class="{ 'has-sidebar': isAuthenticated }">
      <div class="content-wrapper" :class="{ 'mobile-menu-open': isMobileMenuOpen }">
        <div v-if="isAuthenticated" class="profile-container">
          <ProfileMenu />
        </div>
        <router-view />
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app {
  min-height: 100vh;
  background-color: #f7fafc;
}

main {
  min-height: 100vh;
  transition: padding-left 0.3s ease;
  
  &.has-sidebar {
    padding-left: 240px;
  }
}

.mobile-menu-button {
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1001;
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  
  span {
    display: block;
    width: 24px;
    height: 2px;
    background-color: #1a202c;
    margin: 4px 0;
    transition: 0.3s;
  }
  
  &.is-active {
    span:first-child {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    span:nth-child(2) {
      opacity: 0;
    }
    
    span:last-child {
      transform: rotate(-45deg) translate(5px, -5px);
    }
  }
}

@media (max-width: 768px) {
  main.has-sidebar {
    padding-left: 0;
  }
  
  .mobile-menu-button {
    display: block;
  }
  
  .content-wrapper {
    padding: 1rem;
    
    &.mobile-menu-open {
      filter: blur(2px);
      pointer-events: none;
    }
  }
}

.profile-container {
  position: absolute;
  top: 1rem;
  right: 2rem;
  z-index: 50;
}
</style>
