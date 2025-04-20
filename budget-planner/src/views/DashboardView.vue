<template>
  <div class="dashboard">
    <div class="header">
      <h1>Dashboard</h1>
      <div class="header-actions">
        <button class="add-button" @click="showAddTransactionModal = true">
          <font-awesome-icon icon="plus" />
          <span>Add Transaction</span>
        </button>
      </div>
    </div>

    <div class="stats-grid" :class="{ 'sidebar-expanded': !isSidebarCollapsed }">
      <div class="stat-card" @click="showDetailsModal('balance')">
        <div class="stat-header">
          <div class="stat-icon balance">
            <font-awesome-icon icon="wallet" />
          </div>
          <h3>Total Balance</h3>
        </div>
        <div class="stat-value">Rp{{ formatNumber(totalBalance) }}</div>
        <div class="stat-trend" v-if="hasTransactions" :class="{ 
          'positive': balanceChangePercent > 0,
          'negative': balanceChangePercent < 0,
          'neutral': balanceChangePercent === 0 
        }">
          <font-awesome-icon :icon="balanceChangePercent > 0 ? 'arrow-up' : balanceChangePercent < 0 ? 'arrow-down' : 'equals'" />
          {{ formatNumber(Math.abs(balanceChangePercent)) }}% vs {{ timeRangeText }}
        </div>
        <div class="stat-trend new-user" v-else>
          Welcome! Add your first transaction
        </div>
      </div>

      <div class="stat-card" @click="showDetailsModal('income')">
        <div class="stat-header">
          <div class="stat-icon income">
            <font-awesome-icon icon="arrow-up" />
          </div>
          <h3>Total Income</h3>
        </div>
        <div class="stat-value income">Rp{{ formatNumber(totalIncome) }}</div>
        <div class="stat-trend" v-if="hasTransactions" :class="{ 
          'positive': incomeChangePercent > 0,
          'negative': incomeChangePercent < 0,
          'neutral': incomeChangePercent === 0 
        }">
          <font-awesome-icon :icon="incomeChangePercent > 0 ? 'arrow-up' : incomeChangePercent < 0 ? 'arrow-down' : 'equals'" />
          {{ formatNumber(Math.abs(incomeChangePercent)) }}% vs {{ timeRangeText }}
        </div>
        <div class="stat-trend new-user" v-else>
          Track your earnings here
        </div>
      </div>

      <div class="stat-card" @click="showDetailsModal('expense')">
        <div class="stat-header">
          <div class="stat-icon expense">
            <font-awesome-icon icon="arrow-down" />
          </div>
          <h3>Total Expenses</h3>
        </div>
        <div class="stat-value expense">Rp{{ formatNumber(totalExpenses) }}</div>
        <div class="stat-trend" v-if="hasTransactions" :class="{ 
          'positive': expenseChangePercent < 0,
          'negative': expenseChangePercent > 0,
          'neutral': expenseChangePercent === 0 
        }">
          <font-awesome-icon :icon="expenseChangePercent < 0 ? 'arrow-down' : expenseChangePercent > 0 ? 'arrow-up' : 'equals'" />
          {{ formatNumber(Math.abs(expenseChangePercent)) }}% vs {{ timeRangeText }}
        </div>
        <div class="stat-trend new-user" v-else>
          Monitor your spending here
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="charts-section">
        <div class="section-header">
          <h2>Financial Overview</h2>
          <select v-model="timeRange" class="time-range-select">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div class="charts-content">
          <DashboardCharts :period="timeRange" />
        </div>
      </div>

      <div class="recent-transactions">
        <div class="section-header">
          <h2>Recent Transactions</h2>
          <router-link to="/transactions" class="view-all">View All</router-link>
        </div>
        
        <div class="transactions-list">
          <div v-if="error" class="error-state">
            <font-awesome-icon icon="exclamation-circle" class="error-icon" />
            <p>{{ error }}</p>
            <button class="retry-button" @click="transactionStore.fetchTransactions()">
              Try Again
            </button>
          </div>
          
          <div v-else-if="isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading transactions...</p>
          </div>

          <div v-else-if="recentTransactions.length === 0" class="empty-state">
            <font-awesome-icon icon="receipt" class="empty-icon" />
            <p>No transactions yet</p>
            <button class="add-button small" @click="showAddTransactionModal = true">
              Add Your First Transaction
            </button>
          </div>

          <div v-else v-for="transaction in recentTransactions" :key="transaction.id" 
               class="transaction-item" 
               @click="showTransactionDetails(transaction)">
            <div class="transaction-icon" :class="transaction.type">
              <font-awesome-icon :icon="getTransactionIcon(transaction.category)" />
            </div>
            <div class="transaction-details">
              <div class="transaction-info">
                <span class="transaction-category">{{ transaction.category_name || transaction.category }}</span>
                <span class="transaction-description">{{ transaction.description }}</span>
                <span class="transaction-date">{{ formatDate(transaction.date) }}</span>
              </div>
              <div class="transaction-amount" :class="transaction.type">
                {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount, transaction.currency || 'IDR') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Transaction Modal -->
    <div v-if="showAddTransactionModal" class="modal-backdrop" @click="showAddTransactionModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add Transaction</h2>
          <button class="close-button" @click="showAddTransactionModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="transaction-form">
          <div class="form-group">
            <label for="type">Type</label>
            <select id="type" v-model="newTransaction.type" required>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div class="form-group">
            <label for="amount">Amount</label>
            <input 
              type="number" 
              id="amount" 
              v-model="newTransaction.amount" 
              step="0.01" 
              min="0" 
              required
            />
          </div>

          <div class="form-group">
            <label for="category">Category</label>
            <select id="category" v-model="newTransaction.category" required>
              <option value="">Select a category</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="date">Date</label>
            <input 
              type="date" 
              id="date" 
              v-model="newTransaction.date" 
              required
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description" 
              v-model="newTransaction.description" 
              rows="3"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-button" @click="showAddTransactionModal = false">
              Cancel
            </button>
            <button type="submit" class="submit-button">
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetails" class="modal-backdrop" @click="showDetails = false">
      <div class="modal-content details-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ detailsTitle }}</h2>
          <button class="close-button" @click="showDetails = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        
        <div class="details-content">
          <div class="details-summary">
            <div class="summary-item">
              <span class="label">Current Total</span>
              <span class="value" :class="changeClass">{{ formatCurrency(currentTotal) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Last Month</span>
              <span class="value">{{ formatCurrency(lastMonthTotal) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Change</span>
              <span class="value" :class="changeClass">{{ formatNumber(Math.abs(changePercent)) }}%</span>
            </div>
          </div>

          <div class="details-chart">
            <h3>Monthly Trend</h3>
            <div class="chart-placeholder">
              <!-- Chart component will be added here -->
              <p>Monthly trend visualization coming soon</p>
            </div>
          </div>

          <div class="details-list">
            <h3>Recent Transactions</h3>
            <div v-if="filteredTransactions.length === 0" class="empty-state">
              <p>No transactions found</p>
            </div>
            <div v-else class="transactions-list">
              <div v-for="transaction in filteredTransactions" :key="transaction.id" class="transaction-item">
                <div class="transaction-icon" :class="transaction.type">
                  <font-awesome-icon :icon="getTransactionIcon(transaction.category)" />
                </div>
                <div class="transaction-details">
                  <div class="transaction-info">
                    <span class="transaction-category">{{ transaction.category_name || 'Uncategorized' }}</span>
                    <span class="transaction-description">{{ transaction.description }}</span>
                    <span class="transaction-date">{{ formatDate(transaction.date) }}</span>
                  </div>
                  <div class="transaction-amount" :class="transaction.type">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount, transaction.currency || 'IDR') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Details Modal -->
    <div v-if="selectedTransaction" class="modal-backdrop" @click="selectedTransaction = null">
      <div class="modal-content transaction-details-modal" @click.stop>
        <div class="modal-header">
          <h2>Transaction Details</h2>
          <button class="close-button" @click="selectedTransaction = null">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        
        <div class="transaction-details-content">
          <div class="transaction-details-icon" :style="{ backgroundColor: (selectedTransaction.category_color || '#718096') + '20' }">
            <font-awesome-icon :icon="getTransactionIcon(selectedTransaction.category_name || selectedTransaction.category)" 
                             :style="{ color: selectedTransaction.category_color || '#718096' }" />
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <label>Description</label>
              <p>{{ selectedTransaction.description || 'No description' }}</p>
            </div>
            
            <div class="detail-item">
              <label>Amount</label>
              <p :class="['amount', selectedTransaction.type]">
                {{ formatCurrency(selectedTransaction.amount, selectedTransaction.currency || 'IDR') }}
                <small v-if="selectedTransaction.currency !== 'IDR'" class="conversion">
                  ({{ formatCurrency(selectedTransaction.amount_idr || selectedTransaction.amount, 'IDR') }})
                </small>
              </p>
            </div>

            <div class="detail-item">
              <label>Type</label>
              <p :class="['type-badge', selectedTransaction.type]">
                {{ selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1) }}
              </p>
            </div>

            <div class="detail-item">
              <label>Category</label>
              <p class="category-text">
                {{ selectedTransaction.category_name || selectedTransaction.category || 'Uncategorized' }}
              </p>
            </div>

            <div class="detail-item">
              <label>Date</label>
              <p>{{ formatDate(selectedTransaction.date) }}</p>
            </div>

            <div v-if="selectedTransaction.currency !== 'IDR'" class="detail-item">
              <label>Amount in IDR</label>
              <p>{{ formatCurrency(selectedTransaction.amount_idr || selectedTransaction.amount, 'IDR') }}</p>
            </div>
          </div>

          <div class="modal-actions">
            <button 
              class="delete-button" 
              @click="deleteTransaction(selectedTransaction.id)"
            >
              <font-awesome-icon icon="trash" />
              Delete Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import DashboardCharts from '@/components/DashboardCharts.vue'
import { formatNumber, formatDate, formatCurrency } from '@/utils/formatters'
import { getTransactionIcon } from '@/utils/icons'

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

const props = defineProps<{
  isSidebarCollapsed: boolean
}>()

const timeRange = ref('month')
const transactionStore = useTransactionStore()
const showAddTransactionModal = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const newTransaction = ref({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  category: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
  currency: 'IDR'
})

const categories = [
  'Salary',
  'Freelance',
  'Investments',
  'Shopping',
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Education'
]

const totalBalance = computed(() => {
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Start of the week (Sunday)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(currentDay - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  // Start of the month
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  
  // Start of the year
  const startOfYear = new Date(currentYear, 0, 1)
  
  let filteredTransactions = transactionStore.transactions
  
  switch (timeRange.value) {
    case 'week':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfWeek)
      break
    case 'month':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfMonth)
      break
    case 'year':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfYear)
      break
  }
  
  return filteredTransactions.reduce((total, t) => {
    const amount = t.amount_idr || t.amount
    return total + (t.type === 'income' ? amount : -amount)
  }, 0)
})

const totalIncome = computed(() => {
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Start of the week (Sunday)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(currentDay - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  // Start of the month
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  
  // Start of the year
  const startOfYear = new Date(currentYear, 0, 1)
  
  let filteredTransactions = transactionStore.transactions
  
  switch (timeRange.value) {
    case 'week':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfWeek)
      break
    case 'month':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfMonth)
      break
    case 'year':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfYear)
      break
  }
  
  return filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((total, t) => total + (t.amount_idr || t.amount), 0)
})

const totalExpenses = computed(() => {
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Start of the week (Sunday)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(currentDay - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  // Start of the month
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  
  // Start of the year
  const startOfYear = new Date(currentYear, 0, 1)
  
  let filteredTransactions = transactionStore.transactions
  
  switch (timeRange.value) {
    case 'week':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfWeek)
      break
    case 'month':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfMonth)
      break
    case 'year':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfYear)
      break
  }
  
  return filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((total, t) => total + (t.amount_idr || t.amount), 0)
})

const recentTransactions = computed(() => {
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Start of the week (Sunday)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(currentDay - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  // Start of the month
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  
  // Start of the year
  const startOfYear = new Date(currentYear, 0, 1)
  
  let filteredTransactions = transactionStore.transactions
  
  switch (timeRange.value) {
    case 'week':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfWeek)
      break
    case 'month':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfMonth)
      break
    case 'year':
      filteredTransactions = transactionStore.transactions.filter(t => new Date(t.date) >= startOfYear)
      break
  }
  
  // Sort by date in descending order (most recent first)
  return filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const hasTransactions = computed(() => transactionStore.transactions.length > 0)

const timeRangeText = computed(() => {
  switch (timeRange.value) {
    case 'week':
      return 'last week'
    case 'month':
      return 'last month'
    case 'year':
      return 'last year'
    default:
      return 'last month'
  }
})

const balanceChangePercent = computed(() => {
  if (!hasTransactions.value) return 0
  
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  let currentPeriodStart: Date
  let previousPeriodStart: Date
  let currentPeriodEnd: Date
  let previousPeriodEnd: Date
  
  switch (timeRange.value) {
    case 'week':
      // Current week (Sunday to Saturday)
      currentPeriodStart = new Date(now)
      currentPeriodStart.setDate(currentDay - now.getDay())
      currentPeriodStart.setHours(0, 0, 0, 0)
      
      currentPeriodEnd = new Date(currentPeriodStart)
      currentPeriodEnd.setDate(currentPeriodStart.getDate() + 6)
      currentPeriodEnd.setHours(23, 59, 59, 999)
      
      // Previous week (Sunday to Saturday)
      previousPeriodStart = new Date(currentPeriodStart)
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7)
      previousPeriodEnd = new Date(currentPeriodStart)
      previousPeriodEnd.setHours(23, 59, 59, 999)
      break
      
    case 'month':
      // Current month
      currentPeriodStart = new Date(currentYear, currentMonth, 1)
      currentPeriodEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
      
      // Previous month
      previousPeriodStart = new Date(currentYear, currentMonth - 1, 1)
      previousPeriodEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
      break
      
    case 'year':
      // Current year
      currentPeriodStart = new Date(currentYear, 0, 1)
      currentPeriodEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999)
      
      // Previous year
      previousPeriodStart = new Date(currentYear - 1, 0, 1)
      previousPeriodEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999)
      break
      
    default:
      currentPeriodStart = new Date(currentYear, currentMonth, 1)
      currentPeriodEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
      previousPeriodStart = new Date(currentYear, currentMonth - 1, 1)
      previousPeriodEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
  }
  
  // Get current period's transactions
  const currentPeriodTransactions = transactionStore.transactions.filter(t => {
    const date = new Date(t.date)
    return date >= currentPeriodStart && date <= currentPeriodEnd
  })
  
  // Get previous period's transactions
  const previousPeriodTransactions = transactionStore.transactions.filter(t => {
    const date = new Date(t.date)
    return date >= previousPeriodStart && date <= previousPeriodEnd
  })
  
  // Calculate totals
  const currentTotal = currentPeriodTransactions.reduce((total, t) => {
    const amount = t.amount_idr || t.amount
    return total + (t.type === 'income' ? amount : -amount)
  }, 0)
  
  const previousTotal = previousPeriodTransactions.reduce((total, t) => {
    const amount = t.amount_idr || t.amount
    return total + (t.type === 'income' ? amount : -amount)
  }, 0)
  
  // If there were no transactions in the previous period, return 100% increase if current period has transactions
  if (previousTotal === 0) {
    return currentTotal > 0 ? 100 : 0
  }
  
  return ((currentTotal - previousTotal) / Math.abs(previousTotal)) * 100
})

const incomeChangePercent = computed(() => {
  if (!hasTransactions.value) return 0
  
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  let currentPeriodStart: Date
  let previousPeriodStart: Date
  let currentPeriodEnd: Date
  let previousPeriodEnd: Date
  
  switch (timeRange.value) {
    case 'week':
      // Current week (Sunday to Saturday)
      currentPeriodStart = new Date(now)
      currentPeriodStart.setDate(currentDay - now.getDay())
      currentPeriodStart.setHours(0, 0, 0, 0)
      
      currentPeriodEnd = new Date(currentPeriodStart)
      currentPeriodEnd.setDate(currentPeriodStart.getDate() + 6)
      currentPeriodEnd.setHours(23, 59, 59, 999)
      
      // Previous week (Sunday to Saturday)
      previousPeriodStart = new Date(currentPeriodStart)
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7)
      previousPeriodEnd = new Date(currentPeriodStart)
      previousPeriodEnd.setHours(23, 59, 59, 999)
      break
      
    case 'month':
      // Current month
      currentPeriodStart = new Date(currentYear, currentMonth, 1)
      currentPeriodEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
      
      // Previous month
      previousPeriodStart = new Date(currentYear, currentMonth - 1, 1)
      previousPeriodEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
      break
      
    case 'year':
      // Current year
      currentPeriodStart = new Date(currentYear, 0, 1)
      currentPeriodEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999)
      
      // Previous year
      previousPeriodStart = new Date(currentYear - 1, 0, 1)
      previousPeriodEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999)
      break
      
    default:
      currentPeriodStart = new Date(currentYear, currentMonth, 1)
      currentPeriodEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
      previousPeriodStart = new Date(currentYear, currentMonth - 1, 1)
      previousPeriodEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
  }
  
  // Get current period's income
  const currentPeriodIncome = transactionStore.transactions
    .filter(t => {
      const date = new Date(t.date)
      return date >= currentPeriodStart && date <= currentPeriodEnd && t.type === 'income'
    })
    .reduce((total, t) => total + (t.amount_idr || t.amount), 0)
  
  // Get previous period's income
  const previousPeriodIncome = transactionStore.transactions
    .filter(t => {
      const date = new Date(t.date)
      return date >= previousPeriodStart && date <= previousPeriodEnd && t.type === 'income'
    })
    .reduce((total, t) => total + (t.amount_idr || t.amount), 0)
  
  // If there was no income in the previous period, return 100% increase if current period has income
  if (previousPeriodIncome === 0) {
    return currentPeriodIncome > 0 ? 100 : 0
  }
  
  return ((currentPeriodIncome - previousPeriodIncome) / previousPeriodIncome) * 100
})

const expenseChangePercent = computed(() => {
  if (!hasTransactions.value) return 0
  
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  let currentPeriodStart: Date
  let previousPeriodStart: Date
  let currentPeriodEnd: Date
  let previousPeriodEnd: Date
  
  switch (timeRange.value) {
    case 'week':
      // Current week (Sunday to Saturday)
      currentPeriodStart = new Date(now)
      currentPeriodStart.setDate(currentDay - now.getDay())
      currentPeriodStart.setHours(0, 0, 0, 0)
      
      currentPeriodEnd = new Date(currentPeriodStart)
      currentPeriodEnd.setDate(currentPeriodStart.getDate() + 6)
      currentPeriodEnd.setHours(23, 59, 59, 999)
      
      // Previous week (Sunday to Saturday)
      previousPeriodStart = new Date(currentPeriodStart)
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7)
      previousPeriodEnd = new Date(currentPeriodStart)
      previousPeriodEnd.setHours(23, 59, 59, 999)
      break
      
    case 'month':
      // Current month
      currentPeriodStart = new Date(currentYear, currentMonth, 1)
      currentPeriodEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
      
      // Previous month
      previousPeriodStart = new Date(currentYear, currentMonth - 1, 1)
      previousPeriodEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
      break
      
    case 'year':
      // Current year
      currentPeriodStart = new Date(currentYear, 0, 1)
      currentPeriodEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999)
      
      // Previous year
      previousPeriodStart = new Date(currentYear - 1, 0, 1)
      previousPeriodEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999)
      break
      
    default:
      currentPeriodStart = new Date(currentYear, currentMonth, 1)
      currentPeriodEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
      previousPeriodStart = new Date(currentYear, currentMonth - 1, 1)
      previousPeriodEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
  }
  
  // Get current period's expenses
  const currentPeriodExpenses = transactionStore.transactions
    .filter(t => {
      const date = new Date(t.date)
      return date >= currentPeriodStart && date <= currentPeriodEnd && t.type === 'expense'
    })
    .reduce((total, t) => total + (t.amount_idr || t.amount), 0)
  
  // Get previous period's expenses
  const previousPeriodExpenses = transactionStore.transactions
    .filter(t => {
      const date = new Date(t.date)
      return date >= previousPeriodStart && date <= previousPeriodEnd && t.type === 'expense'
    })
    .reduce((total, t) => total + (t.amount_idr || t.amount), 0)
  
  // If there were no expenses in the previous period, return 100% increase if current period has expenses
  if (previousPeriodExpenses === 0) {
    return currentPeriodExpenses > 0 ? 100 : 0
  }
  
  return ((currentPeriodExpenses - previousPeriodExpenses) / previousPeriodExpenses) * 100
})

const showDetails = ref(false)
const selectedType = ref<'balance' | 'income' | 'expense'>('balance')
const currentTotal = ref(0)
const lastMonthTotal = ref(0)
const changePercent = ref(0)
const filteredTransactions = ref<Transaction[]>([])

const detailsTitle = computed(() => {
  switch (selectedType.value) {
    case 'balance':
      return 'Balance Details'
    case 'income':
      return 'Income Details'
    case 'expense':
      return 'Expense Details'
    default:
      return 'Details'
  }
})

const changeClass = computed(() => {
  if (changePercent.value > 0) return 'positive'
  if (changePercent.value < 0) return 'negative'
  return 'neutral'
})

const showDetailsModal = (type: 'balance' | 'income' | 'expense') => {
  selectedType.value = type
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Get current month's transactions
  const currentMonthTransactions = transactionStore.transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  
  // Get last month's transactions
  const lastMonthTransactions = transactionStore.transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear
  })
  
  // Calculate totals based on type
  if (type === 'balance') {
    currentTotal.value = currentMonthTransactions.reduce((total, t) => {
      const amount = t.amount_idr || t.amount
      return total + (t.type === 'income' ? amount : -amount)
    }, 0)
    
    lastMonthTotal.value = lastMonthTransactions.reduce((total, t) => {
      const amount = t.amount_idr || t.amount
      return total + (t.type === 'income' ? amount : -amount)
    }, 0)
    
    filteredTransactions.value = currentMonthTransactions
  } else {
    currentTotal.value = currentMonthTransactions
      .filter(t => t.type === type)
      .reduce((total, t) => total + (t.amount_idr || t.amount), 0)
    
    lastMonthTotal.value = lastMonthTransactions
      .filter(t => t.type === type)
      .reduce((total, t) => total + (t.amount_idr || t.amount), 0)
    
    filteredTransactions.value = currentMonthTransactions.filter(t => t.type === type)
  }
  
  // Calculate change percentage
  if (lastMonthTotal.value === 0) {
    changePercent.value = currentTotal.value > 0 ? 100 : 0
  } else {
    changePercent.value = ((currentTotal.value - lastMonthTotal.value) / Math.abs(lastMonthTotal.value)) * 100
  }
  
  showDetails.value = true
}

const handleSubmit = async () => {
  try {
    isLoading.value = true
    error.value = null
    await transactionStore.addTransaction(newTransaction.value)
    showAddTransactionModal.value = false
    newTransaction.value = {
      type: 'expense' as 'income' | 'expense',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      currency: 'IDR'
    }
  } catch (err) {
    error.value = 'Failed to add transaction. Please try again.'
    console.error('Error adding transaction:', err)
  } finally {
    isLoading.value = false
  }
}

const selectedTransaction = ref<Transaction | null>(null)

const showTransactionDetails = (transaction: Transaction) => {
  selectedTransaction.value = transaction
}

const deleteTransaction = async (transactionId: string) => {
  try {
    await transactionStore.deleteTransaction(transactionId)
    selectedTransaction.value = null
    // Refresh transactions
    await transactionStore.fetchTransactions()
  } catch (error) {
    console.error('Error deleting transaction:', error)
    alert('Failed to delete transaction')
  }
}

onMounted(async () => {
  try {
    isLoading.value = true
    error.value = null
    await transactionStore.fetchTransactions()
  } catch (err) {
    error.value = 'Failed to load transactions. Please refresh the page.'
    console.error('Error fetching transactions:', err)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 2rem 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0;
  }
}

.add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #5a67d8;
    transform: translateY(-1px);
  }

  &.small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  &.sidebar-expanded {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .stat-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;

    h3 {
      font-size: 1rem;
      font-weight: 500;
      color: #4a5568;
      margin: 0;
    }
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;
    font-size: 1.25rem;

    &.balance {
      background: #ebf4ff;
      color: #3182ce;
    }

    &.income {
      background: #f0fff4;
      color: #38a169;
    }

    &.expense {
      background: #fff5f5;
      color: #e53e3e;
    }
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;

    &.income {
      color: #38a169;
    }

    &.expense {
      color: #e53e3e;
    }
  }

  .stat-trend {
    font-size: 0.875rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &.new-user {
      color: #718096;
      font-style: italic;
    }

    &.positive {
      color: #48bb78;
    }

    &.negative {
      color: #e53e3e;
    }

    &.neutral {
      color: #4299e1;
    }
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.charts-section, .recent-transactions {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.section-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
  }
}

.charts-content {
  padding: 1.5rem;
}

.time-range-select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #4a5568;
  font-size: 0.875rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.view-all {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;

  &:hover {
    text-decoration: underline;
  }
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #f8fafc;
  transition: transform 0.2s, background-color 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateX(4px);
    background: #f1f5f9;
  }
}

.transaction-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  font-size: 1rem;

  &.income {
    background: #f0fff4;
    color: #38a169;
  }

  &.expense {
    background: #fff5f5;
    color: #e53e3e;
  }
}

.transaction-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transaction-category {
  font-weight: 500;
  color: #2d3748;
}

.transaction-description {
  font-size: 0.875rem;
  color: #4a5568;
}

.transaction-date {
  font-size: 0.75rem;
  color: #718096;
}

.transaction-amount {
  font-weight: 600;
  color: #2d3748;

  &.income {
    color: #38a169;
  }

  &.expense {
    color: #e53e3e;
  }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #718096;

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    margin-bottom: 1rem;
  }
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
  }
}

.close-button {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;

  &:hover {
    background: #f7fafc;
  }
}

.transaction-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4a5568;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 1rem;
    color: #2d3748;
    background: white;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background: #edf2f7;
  color: #4a5568;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #e2e8f0;
  }
}

.submit-button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #5a67d8;
  }
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #718096;

  .loading-spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 1rem;
    border: 3px solid #e2e8f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.error-state {
  text-align: center;
  padding: 2rem;
  color: #e53e3e;

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 1rem;
  }
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #c53030;
    transform: translateY(-1px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    
    &.sidebar-expanded {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 0.5rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1.5rem;

    h1 {
      font-size: 1.5rem;
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;

    .stat-value {
      font-size: 1.5rem;
    }
  }

  .content-grid {
    gap: 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;

    h2 {
      font-size: 1.25rem;
    }
  }

  .time-range-select {
    width: 100%;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.5rem;

    button {
      width: 100%;
    }
  }
}

.details-modal {
  max-width: 800px;
  max-height: 90vh;
}

.details-content {
  padding: 1.5rem;
}

.details-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .label {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.5rem;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;

    &.income {
      color: #38a169;
    }

    &.expense {
      color: #e53e3e;
    }

    &.positive {
      color: #48bb78;
    }

    &.negative {
      color: #e53e3e;
    }

    &.neutral {
      color: #4299e1;
    }
  }
}

.details-chart {
  margin-bottom: 2rem;

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }
}

.chart-placeholder {
  height: 200px;
  background: #f8fafc;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
}

.details-list {
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }
}

@media (max-width: 768px) {
  .details-summary {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.transaction-details-modal {
  max-width: 480px;
}

.transaction-details-content {
  padding: 2rem;
}

.transaction-details-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto 2rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.detail-item {
  label {
    display: block;
    color: #718096;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: #2d3748;
    font-size: 1rem;
    font-weight: 500;
    margin: 0;

    &.amount {
      font-size: 1.25rem;
      font-weight: 600;

      &.income {
        color: #48bb78;
      }

      &.expense {
        color: #e53e3e;
      }
    }
  }
}

.conversion {
  display: block;
  color: #718096;
  font-weight: normal;
  font-size: 0.75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.delete-button {
  padding: 0.75rem 1.5rem;
  background-color: #fff5f5;
  color: #e53e3e;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: #fed7d7;
  }
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

.category-text {
  color: #2d3748;
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}
</style> 