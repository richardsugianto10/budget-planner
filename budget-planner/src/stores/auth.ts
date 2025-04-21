import { defineStore } from 'pinia';
import api from '../utils/axios';

interface User {
  id: number;
  email: string;
  username: string;
  display_picture?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

interface RegisterData {
  username: string
  email: string
  password: string
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
    },

    clearToken() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    },

    async login(email: string, password: string) {
      try {
        const response = await api.post('/auth/login', {
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

    async register(data: RegisterData) {
      try {
        console.log('Attempting registration with:', { ...data, password: '[REDACTED]' });
        const response = await api.post('/auth/register', data);
        console.log('Registration response:', response.data);
        
        if (response.data.token) {
          this.setToken(response.data.token);
          this.user = response.data.user;
          return { success: true };
        } else {
          throw new Error('No token received from server');
        }
      } catch (error: any) {
        console.error('Registration error:', error.response || error);
        throw {
          message: error.response?.data?.message || 'Registration failed',
          status: error.response?.status,
          details: error.response?.data
        };
      }
    },

    async logout() {
      try {
        if (this.token) {
          await api.post('/auth/logout');
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearToken();
      }
    },

    async fetchUser() {
      try {
        console.log('Fetching user data...');
        const response = await api.get('/auth/me');
        console.log('Raw API response:', response.data);
        this.user = response.data.user;
        console.log('Updated user state:', this.user);
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