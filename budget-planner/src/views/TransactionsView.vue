<template>
  <div class="transactions-view">
    <h1>Transactions</h1>
    
    <div class="transactions-actions">
      <div class="filter-container">
        <select v-model="selectedPeriod" class="period-selector">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Date</option>
        </select>
        
        <div v-if="selectedPeriod === 'custom'" class="date-range">
          <input 
            type="date" 
            v-model="startDate" 
            class="date-input"
          />
          <span>to</span>
          <input 
            type="date" 
            v-model="endDate" 
            class="date-input"
          />
          <button @click="applyCustomDate" class="apply-button">Apply</button>
        </div>
      </div>
      
      <button @click="exportToCSV" class="export-button">
        <font-awesome-icon icon="file-export" />
        Export to CSV
      </button>
    </div>
    
    <div class="table-container">
      <table class="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody v-if="filteredTransactions.length > 0">
          <tr v-for="transaction in filteredTransactions" :key="transaction.id">
            <td>{{ formatDate(transaction.date) }}</td>
            <td>{{ transaction.description }}</td>
            <td>
              <span 
                class="category-badge" 
                :style="{ backgroundColor: transaction.category_color + '20', color: transaction.category_color }"
              >
                {{ transaction.category_name || 'Uncategorized' }}
              </span>
            </td>
            <td>
              <span :class="['type-badge', transaction.type]">
                {{ transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) }}
              </span>
            </td>
            <td :class="['amount', transaction.type]">
              {{ formatCurrency(transaction.amount, transaction.currency || 'IDR') }}
              <small v-if="transaction.currency !== 'IDR'" class="conversion">
                ({{ formatCurrency(transaction.amount_idr || transaction.amount, 'IDR') }})
              </small>
            </td>
            <td>
              <button class="action-button view-button" @click="viewTransaction(transaction)">
                <font-awesome-icon icon="eye" />
              </button>
              <button class="action-button delete-button" @click="confirmDelete(transaction)">
                <font-awesome-icon icon="trash" />
              </button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" class="empty-message">
              <p>No transactions found for the selected period.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Transaction Details Modal -->
    <div v-if="selectedTransaction" class="modal-overlay" @click.self="selectedTransaction = null">
      <div class="modal-content transaction-details-modal">
        <div class="modal-header">
          <h2>Transaction Details</h2>
          <button class="close-button" @click="selectedTransaction = null">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="transaction-details-content">
          <div class="transaction-details-icon" :style="{ backgroundColor: (selectedTransaction.category_color || '#718096') + '20' }">
            <font-awesome-icon :icon="getTransactionIcon(selectedTransaction.category_name || 'Other')" :style="{ color: selectedTransaction.category_color || '#718096' }" />
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <label>Description</label>
              <p>{{ selectedTransaction.description }}</p>
            </div>
            
            <div class="detail-item">
              <label>Amount</label>
              <p :class="['amount', selectedTransaction.type]">
                {{ formatCurrency(selectedTransaction.amount, selectedTransaction.currency || 'IDR') }}
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
                {{ selectedTransaction.category_name || 'Uncategorized' }}
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
    
    <!-- Delete Confirmation Modal -->
    <div v-if="transactionToDelete" class="modal-overlay" @click.self="transactionToDelete = null">
      <div class="modal-content confirmation-modal">
        <div class="modal-header">
          <h2>Confirm Deletion</h2>
          <button class="close-button" @click="transactionToDelete = null">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="confirmation-content">
          <p>Are you sure you want to delete this transaction?</p>
          <p class="transaction-summary">
            <strong>{{ transactionToDelete.description }}</strong> - 
            {{ formatCurrency(transactionToDelete.amount, transactionToDelete.currency || 'IDR') }}
          </p>
          <div class="modal-actions">
            <button class="cancel-button" @click="transactionToDelete = null">Cancel</button>
            <button class="confirm-button" @click="deleteTransaction(transactionToDelete.id)">
              <font-awesome-icon icon="trash" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTransactionStore } from '../stores/transaction'
import { emitter } from '../utils/event-bus'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

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
}

const authStore = useAuthStore()
const transactionStore = useTransactionStore()

const selectedPeriod = ref('month')
const startDate = ref('')
const endDate = ref('')
const selectedTransaction = ref<Transaction | null>(null)
const transactionToDelete = ref<Transaction | null>(null)
const loading = ref(false)

// Get first and last day of current month for initial date range
const today = new Date()
const currentMonth = today.getMonth()
const currentYear = today.getFullYear()
startDate.value = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
endDate.value = new Date().toISOString().split('T')[0] // Today

// Filter transactions based on the selected period
const filteredTransactions = computed(() => {
  if (!transactionStore.transactions.length) return []
  
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
  
  switch (selectedPeriod.value) {
    case 'week':
      return transactionStore.transactions.filter(t => new Date(t.date) >= startOfWeek)
      
    case 'month':
      return transactionStore.transactions.filter(t => new Date(t.date) >= startOfMonth)
      
    case 'year':
      return transactionStore.transactions.filter(t => new Date(t.date) >= startOfYear)
      
    case 'custom':
      const start = startDate.value ? new Date(startDate.value) : null
      const end = endDate.value ? new Date(endDate.value) : null
      
      if (start && end) {
        // Set end date to end of the day
        end.setHours(23, 59, 59, 999)
        return transactionStore.transactions.filter(t => {
          const date = new Date(t.date)
          return date >= start && date <= end
        })
      }
      return transactionStore.transactions
      
    default:
      return transactionStore.transactions
  }
})

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format currency
const formatCurrency = (amount: number, currency: string = 'IDR'): string => {
  const currencyMap: { [key: string]: string } = {
    IDR: 'id-ID',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    AUD: 'en-AU',
    SGD: 'en-SG',
  }

  return new Intl.NumberFormat(currencyMap[currency] || 'id-ID', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Get transaction icon
const getTransactionIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    Salary: 'money-bill-wave',
    Freelance: 'laptop',
    Investments: 'chart-line',
    Housing: 'home',
    Transportation: 'car',
    Food: 'utensils',
    Utilities: 'bolt',
    Healthcare: 'heartbeat',
    Entertainment: 'film',
    Shopping: 'shopping-bag',
    Education: 'graduation-cap',
    'Other Income': 'plus-circle',
    'Other Expenses': 'minus-circle'
  }
  return iconMap[category] || 'receipt'
}

// Apply custom date
const applyCustomDate = () => {
  if (!startDate.value || !endDate.value) {
    alert('Please select both start and end dates')
    return
  }
  
  fetchTransactions()
}

// Open transaction details
const viewTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction
}

// Confirm delete
const confirmDelete = (transaction: Transaction) => {
  transactionToDelete.value = transaction
}

// Delete transaction
const deleteTransaction = async (transactionId: string) => {
  try {
    await transactionStore.deleteTransaction(transactionId)
    
    // Close the modals
    selectedTransaction.value = null
    transactionToDelete.value = null
    
    // Emit event to refresh charts
    emitter.emit('transaction-added')
  } catch (error) {
    console.error('Error deleting transaction:', error)
    alert('Failed to delete transaction')
  }
}

// Export to CSV
const exportToCSV = () => {
  // Create CSV content
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency', 'Amount (IDR)']
  let csvContent = headers.join(',') + '\n'
  
  filteredTransactions.value.forEach(t => {
    const row = [
      formatDate(t.date),
      `"${t.description || ''}"`, // Handle undefined description
      `"${t.category_name || 'Uncategorized'}"`,
      t.type,
      t.amount,
      t.currency || 'IDR',
      t.amount_idr || t.amount
    ]
    csvContent += row.join(',') + '\n'
  })
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  // Set filename with date
  const dateStr = new Date().toISOString().slice(0, 10)
  link.href = url
  link.setAttribute('download', `transactions_${dateStr}.csv`)
  
  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Fetch transactions
const fetchTransactions = async () => {
  try {
    loading.value = true
    await transactionStore.fetchTransactions()
  } catch (error) {
    console.error('Error fetching transactions:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTransactions()
})
</script>

<style scoped lang="scss">
.transactions-view {
  padding: 1.5rem;
}

h1 {
  margin: 0 0 1.5rem 0;
  color: #2d3748;
  font-size: 1.5rem;
}

.transactions-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.period-selector {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  font-size: 0.875rem;
  color: #4a5568;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.apply-button {
  padding: 0.5rem 1rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a67d8;
  }
}

.export-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #38a169;
  }
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    background-color: #f7fafc;
    color: #4a5568;
    font-weight: 600;
    font-size: 0.875rem;
  }

  td {
    font-size: 0.875rem;
    color: #2d3748;
  }

  .amount {
    font-weight: 600;
    text-align: right;

    &.income {
      color: #48bb78;
    }

    &.expense {
      color: #e53e3e;
    }
  }

  .conversion {
    display: block;
    color: #718096;
    font-weight: normal;
    font-size: 0.75rem;
  }
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
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

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &.view-button {
    color: #4299e1;
  }

  &.delete-button {
    color: #e53e3e;
  }

  &:hover {
    background-color: #edf2f7;
  }
  
  svg {
    width: 1em;
    height: 1em;
  }
}

.empty-message {
  text-align: center;
  color: #718096;
  padding: 3rem 0;
}

/* Modal Styles */
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
  overflow: hidden;
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

.confirmation-modal {
  max-width: 400px;
}

.confirmation-content {
  padding: 1.5rem;

  p {
    margin: 0 0 1rem 0;
    color: #4a5568;
  }

  .transaction-summary {
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    color: #2d3748;
  }
}

.confirm-button {
  padding: 0.75rem 1.5rem;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: #c53030;
  }
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background-color: #edf2f7;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e2e8f0;
  }
}

@media (max-width: 768px) {
  .transactions-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .date-range {
    flex-wrap: wrap;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .transactions-table {
    th, td {
      padding: 0.75rem;
    }
  }
}
</style> 