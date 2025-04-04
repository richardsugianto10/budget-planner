<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Welcome Back</h1>
      <p>Sign in to manage your budget</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
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
            placeholder="Enter your password"
          />
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <button type="submit" class="submit-button" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

        <p class="signup-link">
          Don't have an account?
          <router-link to="/register">Sign up</router-link>
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
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
/* Reset styles */
:root, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7fafc;
  padding: 1rem;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 400px;
  padding: 2rem;

  h1 {
    color: #2d3748;
    font-size: 1.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    text-align: center;
  }

  p {
    color: #718096;
    text-align: center;
    margin-bottom: 2rem;
  }

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      color: #4a5568;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }
  }

  .submit-button {
    width: 100%;
    padding: 0.875rem;
    background-color: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
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
    margin: 1rem 0;
    font-size: 0.875rem;
  }

  .signup-link {
    margin-top: 1.5rem;
    text-align: center;
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