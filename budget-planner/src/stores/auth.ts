import { defineStore } from 'pinia';
import axios from 'axios';

interface User {
  id: number;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user
  },

  actions: {
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    clearToken() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    },

    async login(email: string, password: string) {
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          email,
          password
        });

        const { token, user } = response.data;
        this.setToken(token);
        this.user = user;
        return { success: true };
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed'
        };
      }
    },

    async register(email: string, password: string) {
      try {
        const response = await axios.post('http://localhost:3000/api/auth/register', {
          email,
          password
        });

        const { token, user } = response.data;
        this.setToken(token);
        this.user = user;
        return { success: true };
      } catch (error: any) {
        console.error('Registration error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Registration failed'
        };
      }
    },

    async logout() {
      try {
        if (this.token) {
          await axios.post('http://localhost:3000/api/auth/logout');
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearToken();
      }
    },

    async fetchUser() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/me');
        this.user = response.data.user;
      } catch (error) {
        console.error('Fetch user error:', error);
        this.clearToken();
      }
    },

    init() {
      const token = localStorage.getItem('token');
      if (token) {
        this.setToken(token);
        this.fetchUser();
      }
    }
  }
}); 