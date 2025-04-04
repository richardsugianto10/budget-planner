<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Create Account</h1>
      <p class="subtitle">Start managing your finances today</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            class="form-input"
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            class="form-input"
            placeholder="Create a password"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            class="form-input"
            placeholder="Confirm your password"
          />
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <button type="submit" class="submit-button" :disabled="loading">
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>

        <p class="auth-link">
          Already have an account?
          <router-link to="/login">Sign in</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  try {
    error.value = ''
    
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match'
      return
    }

    loading.value = true
    await authStore.register(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f7fafc;
}

.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;

  h1 {
    color: #2d3748;
    margin: 0 0 0.5rem 0;
    font-size: 1.875rem;
    font-weight: 700;
  }

  .subtitle {
    color: #718096;
    margin-bottom: 2rem;
  }
}

.auth-form {
  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #4a5568;
      font-weight: 500;
    }
  }
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a67d8;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.error-message {
  color: #e53e3e;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #718096;
  font-size: 0.875rem;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style> 