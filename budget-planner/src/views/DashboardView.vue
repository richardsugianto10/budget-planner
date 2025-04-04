<template>
  <div class="dashboard">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <h1>Budget Planner</h1>
      </div>
      <nav class="sidebar-nav">
        <button class="nav-item active">
          <font-awesome-icon icon="chart-pie" />
          <span v-show="!isSidebarCollapsed">Overview</span>
        </button>
        <button class="nav-item">
          <font-awesome-icon icon="exchange-alt" />
          <span v-show="!isSidebarCollapsed">Transactions</span>
        </button>
        <button class="nav-item">
          <font-awesome-icon icon="tag" />
          <span v-show="!isSidebarCollapsed">Categories</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <button @click="logout" class="logout-button">
          <font-awesome-icon icon="sign-out-alt" />
          <span v-show="!isSidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Sidebar Toggle Button -->
    <button 
      class="sidebar-toggle"
      :class="{ 'sidebar-collapsed': isSidebarCollapsed }"
      @click="toggleSidebar"
    >
      <font-awesome-icon :icon="isSidebarCollapsed ? 'chevron-right' : 'chevron-left'" />
    </button>

    <!-- Main Content -->
    <main class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- Header with Balance Overview -->
      <div class="balance-overview">
        <div class="balance-card main-balance">
          <div class="balance-icon">
            <i class="fas fa-wallet"></i>
          </div>
          <div class="balance-info">
            <h3>Total Balance</h3>
            <p :class="['amount', totalBalance >= 0 ? 'positive' : 'negative']">
              {{ formatCurrency(totalBalance) }}
            </p>
          </div>
        </div>

        <div class="balance-card income">
          <div class="balance-icon">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div class="balance-info">
            <h3>Monthly Income</h3>
            <p class="amount">{{ formatCurrency(monthlyIncome) }}</p>
          </div>
        </div>

        <div class="balance-card expense">
          <div class="balance-icon">
            <i class="fas fa-arrow-down"></i>
          </div>
          <div class="balance-info">
            <h3>Monthly Expenses</h3>
            <p class="amount">{{ formatCurrency(monthlyExpenses) }}</p>
          </div>
        </div>
      </div>

      <!-- Charts and Transactions Grid -->
      <div class="dashboard-grid">
        <!-- Left side - Charts -->
        <div class="charts-panel">
          <DashboardCharts />
        </div>

        <!-- Right side - Recent Transactions -->
        <div class="transactions-panel">
          <div class="panel-header">
            <h2>Recent Transactions</h2>
            <button @click="showAddTransaction = true" class="add-button">
              <i class="fas fa-plus"></i>
              Add Transaction
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="!hasTransactions" class="empty-state">
            <img src="../assets/empty-state.svg" alt="No transactions" class="empty-state-icon" />
            <h3>No transactions yet</h3>
            <p>Start tracking your finances by adding your first transaction.</p>
            <button @click="showAddTransaction = true" class="add-button">
              Add Your First Transaction
            </button>
          </div>

          <!-- Transactions list -->
          <div v-else class="transactions-list">
            <div 
              v-for="transaction in transactions" 
              :key="transaction.id" 
              class="transaction-item"
              @click="selectedTransaction = transaction"
            >
              <div class="transaction-icon" :style="{ backgroundColor: transaction.category_color + '20' }">
                <i class="fas" :class="getTransactionIcon(transaction.category_name)" :style="{ color: transaction.category_color }"></i>
              </div>
              <div class="transaction-info">
                <div class="transaction-main">
                  <span class="transaction-name">{{ transaction.description }}</span>
                  <span :class="['transaction-amount', transaction.type]">
                    {{ formatCurrency(transaction.amount, transaction.currency) }}
                  </span>
                </div>
                <div class="transaction-details">
                  <span class="transaction-date">
                    <i class="far fa-calendar"></i>
                    {{ formatDate(transaction.date) }}
                  </span>
                  <span 
                    v-if="transaction.category_name" 
                    class="transaction-category"
                    :style="{ backgroundColor: transaction.category_color + '20', color: transaction.category_color }"
                  >
                    {{ transaction.category_name }}
                  </span>
                  <span v-if="transaction.currency !== 'IDR'" class="transaction-conversion">
                    {{ formatCurrency(transaction.amount_idr, 'IDR') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add Transaction Modal -->
    <div v-if="showAddTransaction" class="modal-overlay" @click.self="showAddTransaction = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ hasTransactions ? 'Add Transaction' : 'Add Your First Transaction' }}</h2>
          <button class="close-button" @click="showAddTransaction = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="addTransaction" class="transaction-form">
          <div class="form-group">
            <label for="transactionDescription">Description</label>
            <input
              type="text"
              id="transactionDescription"
              v-model="newTransaction.description"
              placeholder="e.g., Salary, Rent, Groceries"
              class="form-input"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="transactionAmount">Amount</label>
              <div class="amount-input">
                <span class="currency-symbol">{{ getCurrencySymbol(newTransaction.currency) }}</span>
                <input
                  type="text"
                  id="transactionAmount"
                  v-model="newTransaction.amount"
                  placeholder="0.00"
                  class="form-input"
                  required
                  @input="validateAmount"
                  @keypress="allowNumbersAndDot"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="transactionCurrency">Currency</label>
              <select id="transactionCurrency" v-model="newTransaction.currency" class="form-input" required>
                <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                  {{ curr.symbol }} - {{ curr.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="transactionType">Type</label>
              <select id="transactionType" v-model="newTransaction.type" class="form-input" required>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div class="form-group">
              <label for="transactionCategory">Category</label>
              <select id="transactionCategory" v-model="newTransaction.categoryId" class="form-input" required>
                <option value="">Select a category</option>
                <option 
                  v-for="category in filteredCategories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="transactionDate">Date</label>
            <input
              type="date"
              id="transactionDate"
              v-model="newTransaction.date"
              class="form-input"
              required
            />
          </div>

          <p v-if="transactionError" class="error-message">{{ transactionError }}</p>

          <div class="modal-actions">
            <button type="button" class="cancel-button" @click="showAddTransaction = false">Cancel</button>
            <button type="submit" class="submit-button" :disabled="loading">
              {{ loading ? 'Adding...' : 'Add Transaction' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Transaction Details Modal -->
    <div v-if="selectedTransaction" class="modal-overlay" @click.self="selectedTransaction = null">
      <div class="modal-content transaction-details-modal">
        <div class="modal-header">
          <h2>Transaction Details</h2>
          <button class="close-button" @click="selectedTransaction = null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="transaction-details-content">
          <div class="transaction-details-icon" :style="{ backgroundColor: selectedTransaction.category_color + '20' }">
            <i class="fas" :class="getTransactionIcon(selectedTransaction.category_name)" :style="{ color: selectedTransaction.category_color }"></i>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <label>Description</label>
              <p>{{ selectedTransaction.description }}</p>
            </div>
            
            <div class="detail-item">
              <label>Amount</label>
              <p :class="['amount', selectedTransaction.type]">
                {{ formatCurrency(selectedTransaction.amount, selectedTransaction.currency) }}
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
              <p class="category-badge" 
                 :style="{ backgroundColor: selectedTransaction.category_color + '20', color: selectedTransaction.category_color }">
                {{ selectedTransaction.category_name }}
              </p>
            </div>

            <div class="detail-item">
              <label>Date</label>
              <p>{{ formatDate(selectedTransaction.date) }}</p>
            </div>

            <div v-if="selectedTransaction.currency !== 'IDR'" class="detail-item">
              <label>Amount in IDR</label>
              <p>{{ formatCurrency(selectedTransaction.amount_idr, 'IDR') }}</p>
            </div>
          </div>

          <div class="modal-actions">
            <button 
              class="delete-button" 
              @click="deleteTransaction(selectedTransaction.id)"
            >
              <font-awesome-icon icon="trash-alt" />
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import DashboardCharts from '../components/DashboardCharts.vue'
import axios from 'axios'
import { defineEmitter } from '../utils/event-bus'

const router = useRouter()
const authStore = useAuthStore()

const showAddTransaction = ref(false)
const transactions = ref([])
const categories = ref([])
const transactionError = ref('')
const loading = ref(false)
const selectedTransaction = ref(null)
const isSidebarCollapsed = ref(false)

const newTransaction = ref({
  description: '',
  amount: '',
  type: 'expense',
  categoryId: '',
  currency: 'IDR',
  date: new Date().toISOString().split('T')[0]
})

const currencies = ref([
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
])

const emitter = defineEmitter()

const getCurrencySymbol = (code: string) => {
  return currencies.value.find(c => c.code === code)?.symbol || code
}

const getTransactionIcon = (category: string) => {
  const iconMap: { [key: string]: string } = {
    Salary: 'fa-money-bill-wave',
    Freelance: 'fa-laptop',
    Investments: 'fa-chart-line',
    Housing: 'fa-home',
    Transportation: 'fa-car',
    Food: 'fa-utensils',
    Utilities: 'fa-bolt',
    Healthcare: 'fa-heartbeat',
    Entertainment: 'fa-film',
    Shopping: 'fa-shopping-bag',
    Education: 'fa-graduation-cap',
    'Other Income': 'fa-plus-circle',
    'Other Expenses': 'fa-minus-circle'
  }
  return iconMap[category] || 'fa-receipt'
}

const hasTransactions = computed(() => transactions.value.length > 0)

const filteredCategories = computed(() => {
  return categories.value.filter(c => c.type === newTransaction.value.type)
})

const totalBalance = computed(() => {
  return transactions.value.reduce((total, transaction) => {
    // Ensure amounts are converted to numbers
    const amount = Number(transaction.amount_idr) || 0
    return total + (transaction.type === 'income' ? amount : -amount)
  }, 0)
})

const monthlyIncome = computed(() => {
  const currentMonth = new Date().getMonth()
  return transactions.value
    .filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'income')
    .reduce((total, t) => {
      // Ensure amounts are converted to numbers
      const amount = Number(t.amount_idr) || 0
      return total + amount
    }, 0)
})

const monthlyExpenses = computed(() => {
  const currentMonth = new Date().getMonth()
  return transactions.value
    .filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'expense')
    .reduce((total, t) => {
      // Ensure amounts are converted to numbers
      const amount = Number(t.amount_idr) || 0
      return total + amount
    }, 0)
})

const formatCurrency = (amount: number, currency = 'IDR') => {
  const currencyMap: { [key: string]: string } = {
    IDR: 'id-ID',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    AUD: 'en-AU',
    SGD: 'en-SG',
  }

  return new Intl.NumberFormat(currencyMap[currency], {
    style: 'currency',
    currency: currency
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const validateAmount = (event: Event) => {
  const input = event.target as HTMLInputElement
  // Remove all dots and non-digit characters
  let value = input.value.replace(/\./g, '').replace(/[^\d]/g, '')
  
  // Convert to number
  const num = Number(value)
  
  if (!isNaN(num)) {
    // Format with thousand separators
    newTransaction.value.amount = num.toLocaleString('id-ID').replace(/,/g, '.')
  } else {
    newTransaction.value.amount = ''
  }
}

const allowNumbersAndDot = (event: KeyboardEvent) => {
  const charCode = event.which ? event.which : event.keyCode
  const input = event.target as HTMLInputElement
  const value = input.value
  
  // Allow numbers (0-9)
  if (charCode >= 48 && charCode <= 57) {
    return true
  }
  
  // Allow backspace and delete
  if (charCode === 8 || charCode === 46) {
    return true
  }

  // Prevent any other input
  event.preventDefault()
  return false
}

const fetchTransactions = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/transactions', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    transactions.value = response.data
  } catch (error) {
    console.error('Error fetching transactions:', error)
  }
}

const fetchCategories = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/categories', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    categories.value = response.data
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const addTransaction = async () => {
  transactionError.value = ''

  if (!newTransaction.value.description || !newTransaction.value.amount) {
    transactionError.value = 'Please fill in all required fields'
    return
  }

  // Convert the formatted amount string to a number by removing dots and parsing
  const amount = Number(newTransaction.value.amount.replace(/\./g, ''))
  
  if (isNaN(amount) || amount <= 0) {
    transactionError.value = 'Please enter a valid amount'
    return
  }

  try {
    loading.value = true
    const response = await axios.post(
      'http://localhost:3000/api/transactions',
      {
        description: newTransaction.value.description,
        amount: amount,
        type: newTransaction.value.type,
        categoryId: newTransaction.value.categoryId || null,
        currency: newTransaction.value.currency,
        date: newTransaction.value.date
      },
      {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    )

    transactions.value.unshift(response.data)
    showAddTransaction.value = false

    // Emit event to refresh charts
    emitter.emit('transaction-added')

    // Reset form
    newTransaction.value = {
      description: '',
      amount: '',
      type: 'expense',
      categoryId: '',
      currency: 'IDR',
      date: new Date().toISOString().split('T')[0]
    }
  } catch (error) {
    console.error('Error adding transaction:', error)
    transactionError.value = 'Failed to add transaction'
  } finally {
    loading.value = false
  }
}

const deleteTransaction = async (transactionId: number) => {
  try {
    await axios.delete(`http://localhost:3000/api/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    
    // Remove the transaction from the local list
    transactions.value = transactions.value.filter(t => t.id !== transactionId)
    
    // Close the details modal
    selectedTransaction.value = null
    
    // Emit event to refresh charts
    emitter.emit('transaction-added')
  } catch (error) {
    console.error('Error deleting transaction:', error)
    alert('Failed to delete transaction')
  }
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

onMounted(() => {
  fetchTransactions()
  fetchCategories()
})
</script>

<style scoped lang="scss">
.dashboard {
  display: flex;
  min-height: 100vh;
  background-color: #f7fafc;
  position: relative;
  margin: 0;
  padding: 0;
}

.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 10;
  position: fixed;
  height: 100vh;
  left: 0;

  &.collapsed {
    width: 60px;

    .sidebar-header h1 {
      opacity: 0;
    }

    .nav-item {
      padding: 0.75rem;
      justify-content: center;
    }

    .logout-button {
      padding: 0.75rem;
      justify-content: center;
    }
  }
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;

  h1 {
    margin: 0;
    font-size: 1.25rem;
    color: #2d3748;
    transition: opacity 0.3s ease;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #4a5568;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #edf2f7;
  }

  &.active {
    background: #ebf4ff;
    color: #4299e1;
  }

  i {
    font-size: 1.125rem;
    width: 1.5rem;
    text-align: center;
  }
}

.sidebar-toggle {
  position: fixed;
  left: 240px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-left: none;
  border-radius: 0 4px 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: all 0.3s ease;
  color: #718096;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);

  &:hover {
    color: #4a5568;
    background: #f7fafc;
  }

  &.sidebar-collapsed {
    left: 60px;
  }

  i {
    font-size: 0.75rem;
  }
}

.main-content {
  flex: 1;
  margin-left: 200px;
  padding: 1rem;
  transition: all 0.3s ease;
  min-height: 100vh;

  &.sidebar-collapsed {
    margin-left: 60px;
  }
}

.balance-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.dashboard-grid {
  display: flex;
  gap: 2rem;
  height: calc(100vh - 200px);
}

.charts-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.transactions-panel {
  width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.transactions-list {
  flex: 1;
  overflow-y: auto;
  margin: 0 -1.5rem;
  padding: 0 1.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;

    &:hover {
      background: #a0aec0;
    }
  }

  .transaction-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      background: #f1f5f9;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .transaction-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .transaction-info {
    flex: 1;
    min-width: 0;

    .transaction-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.75rem;

      .transaction-name {
        color: #2d3748;
        font-weight: 600;
        font-size: 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .transaction-amount {
        font-weight: 600;
        font-size: 1.125rem;
        white-space: nowrap;

        &.income {
          color: #48bb78;
        }

        &.expense {
          color: #e53e3e;
        }
      }
    }

    .transaction-details {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      color: #718096;
      font-size: 0.875rem;

      .transaction-date {
        display: flex;
        align-items: center;
        gap: 0.375rem;

        i {
          font-size: 0.875rem;
          color: #a0aec0;
        }
      }

      .transaction-category {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1.25;
      }

      .transaction-conversion {
        color: #a0aec0;
        font-size: 0.75rem;
        font-weight: 500;
      }
    }
  }
}

.balance-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;

  .balance-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  &.main-balance .balance-icon {
    background-color: #ebf4ff;
    color: #667eea;
  }

  &.income .balance-icon {
    background-color: #f0fff4;
    color: #48bb78;
  }

  &.expense .balance-icon {
    background-color: #fff5f5;
    color: #e53e3e;
  }

  .balance-info {
    h3 {
      color: #4a5568;
      font-size: 0.875rem;
      font-weight: 500;
      margin: 0 0 0.25rem 0;
    }

    .amount {
      color: #2d3748;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;

      &.positive {
        color: #48bb78;
      }

      &.negative {
        color: #e53e3e;
      }
    }
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    color: #2d3748;
    font-size: 1.25rem;
    margin: 0;
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;

  .empty-state-icon {
    width: 120px;
    height: 120px;
    margin-bottom: 1.5rem;
  }

  h3 {
    color: #2d3748;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: #718096;
    margin-bottom: 1.5rem;
  }
}

.add-button {
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a67d8;
  }

  i {
    font-size: 0.75rem;
  }
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #fff5f5;
  color: #e53e3e;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #fed7d7;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  margin: 2rem;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    color: #2d3748;
    font-size: 1.25rem;
    margin: 0;
  }
}

.close-button {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  transition: color 0.2s;

  &:hover {
    color: #718096;
  }
}

.transaction-form {
  padding: 1.5rem;

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #4a5568;
    font-weight: 500;
  }
}

.amount-input {
  position: relative;

  .currency-symbol {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #4a5568;
  }

  input {
    padding-left: 2rem;
  }
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.submit-button, .cancel-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button {
  background-color: #667eea;
  color: white;
  border: none;

  &:hover {
    background-color: #5a67d8;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.cancel-button {
  background-color: #edf2f7;
  color: #4a5568;
  border: none;

  &:hover {
    background-color: #e2e8f0;
  }
}

.error-message {
  color: #e53e3e;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
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

  .type-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 500;

    &.income {
      background-color: #f0fff4;
      color: #48bb78;
    }

    &.expense {
      background-color: #fff5f5;
      color: #e53e3e;
    }
  }

  .category-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 500;
  }
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
  margin-top: 2rem;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: #fed7d7;
  }

  svg {
    font-size: 1rem;
  }
}

@media (max-width: 1280px) {
  .dashboard-grid {
    flex-direction: column;
    height: auto;
  }

  .transactions-panel {
    width: 100%;
    height: 500px;
  }

  .charts-panel {
    height: 500px;
  }

  .balance-overview {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &.open {
      transform: translateX(0);
    }
  }

  .sidebar-toggle {
    display: none;
  }

  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 1.5rem;
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 1rem;
  }

  .balance-overview {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    gap: 1rem;
  }

  .charts-panel,
  .transactions-panel {
    padding: 1rem;
  }

  .transactions-list {
    margin: 0 -1rem;
    padding: 0 1rem;

    .transaction-item {
      padding: 0.875rem;
    }

    .transaction-icon {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }

    .transaction-info {
      .transaction-main {
        flex-direction: column;
        gap: 0.375rem;

        .transaction-amount {
          font-size: 1rem;
        }
      }

      .transaction-details {
        gap: 0.5rem;
      }
    }
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .transaction-details-content {
    padding: 1.5rem;
  }
}
</style> 