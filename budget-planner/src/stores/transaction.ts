import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// Configure axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Updated to include /api prefix
  headers: {
    'Content-Type': 'application/json'
  }
})

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
  description?: string
  category_name?: string
  category_color?: string
  currency?: string
  amount_idr?: number
  original_amount?: number
  original_currency?: string
  exchange_rate?: number
}

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])

  // Computed properties for dashboard stats
  const totalBalance = computed(() => {
    return transactions.value.reduce((total, transaction) => {
      const amount = transaction.amount_idr || transaction.amount
      return total + (transaction.type === 'income' ? amount : -amount)
    }, 0)
  })

  const totalIncome = computed(() => {
    return transactions.value
      .filter(t => t.type === 'income')
      .reduce((total, transaction) => total + (transaction.amount_idr || transaction.amount), 0)
  })

  const totalExpenses = computed(() => {
    return transactions.value
      .filter(t => t.type === 'expense')
      .reduce((total, transaction) => total + (transaction.amount_idr || transaction.amount), 0)
  })

  const recentTransactions = computed(() => {
    return [...transactions.value]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  })

  // Actions
  async function fetchTransactions() {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await api.get('/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      transactions.value = response.data
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  async function addTransaction(transaction: Omit<Transaction, 'id' | 'category_name' | 'category_color' | 'amount_idr' | 'original_amount' | 'original_currency' | 'exchange_rate'>) {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await api.post('/transactions', transaction, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      transactions.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Error adding transaction:', error)
      throw error
    }
  }

  async function deleteTransaction(id: string) {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      await api.delete(`/transactions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      transactions.value = transactions.value.filter(t => t.id !== id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  }

  return {
    transactions,
    totalBalance,
    totalIncome,
    totalExpenses,
    recentTransactions,
    fetchTransactions,
    addTransaction,
    deleteTransaction
  }
}) 