<template>
  <div class="charts-container">
    <div class="chart-header">
      <h2>Financial Overview</h2>
      <select v-model="selectedPeriod" class="period-select">
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
      </select>
    </div>

    <div class="charts-grid">
      <div class="chart-wrapper">
        <h3>Income vs Expenses</h3>
        <div v-if="loading" class="loading-state">Loading...</div>
        <div v-else-if="error" class="error-state">{{ error }}</div>
        <div v-else-if="!chartData" class="empty-state">No data available</div>
        <div v-else class="chart-container">
          <Line
            :data="chartData"
            :options="lineOptions"
            class="chart"
          />
        </div>
      </div>

      <div class="chart-wrapper">
        <h3>Expense Categories</h3>
        <div v-if="loading" class="loading-state">Loading...</div>
        <div v-else-if="error" class="error-state">{{ error }}</div>
        <div v-else-if="!doughnutData" class="empty-state">No expense data available</div>
        <div v-else class="chart-container">
          <Doughnut
            :data="doughnutData"
            :options="doughnutOptions"
            class="chart"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { emitter } from '../utils/event-bus'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const authStore = useAuthStore()
const selectedPeriod = ref('month')
const stats = ref({
  daily: [],
  categories: []
})
const loading = ref(false)
const error = ref('')

// Chart Options
const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number) => {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)
        }
      }
    }
  },
  layout: {
    padding: 20
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  },
  layout: {
    padding: 20
  }
}

// Chart Data
const chartData = computed(() => {
  const dailyTotals = stats.value?.daily || []
  
  if (dailyTotals.length === 0) {
    console.log('No daily totals data available:', stats.value)
    return null
  }

  const labels = dailyTotals.map((day: any) => 
    new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )

  const data = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: dailyTotals.map((day: any) => day.income_idr || 0),
        borderColor: '#48bb78',
        backgroundColor: 'rgba(72, 187, 120, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Expenses',
        data: dailyTotals.map((day: any) => day.expense_idr || 0),
        borderColor: '#e53e3e',
        backgroundColor: 'rgba(229, 62, 62, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  console.log('Chart data generated:', data)
  return data
})

const doughnutData = computed(() => {
  const categoryTotals = stats.value?.categories || []
  
  if (categoryTotals.length === 0) {
    console.log('No category totals data available:', stats.value)
    return null
  }

  // Filter for expense categories only and use IDR values
  const expenseCategories = categoryTotals.filter((cat: any) => cat.type === 'expense')

  const data = {
    labels: expenseCategories.map((cat: any) => cat.name || 'Uncategorized'),
    datasets: [{
      data: expenseCategories.map((cat: any) => cat.total_idr || 0),
      backgroundColor: expenseCategories.map((cat: any) => (cat.color || '#CBD5E0') + '80'),
      borderColor: expenseCategories.map((cat: any) => cat.color || '#CBD5E0'),
      borderWidth: 1
    }]
  }

  console.log('Doughnut data generated:', data)
  return data
})

// Fetch transaction statistics
const fetchStats = async () => {
  loading.value = true
  error.value = ''
  
  try {
    console.log('Fetching stats for period:', selectedPeriod.value)
    const response = await axios.get(`http://localhost:3000/api/transactions/stats?period=${selectedPeriod.value}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    console.log('Stats response:', response.data)
    
    // Use the API response structure directly
    stats.value = {
      daily: Array.isArray(response.data?.daily) ? response.data.daily : [],
      categories: Array.isArray(response.data?.categories) ? response.data.categories : []
    }

    console.log('Final stats data:', stats.value)
  } catch (err: any) {
    console.error('Error fetching transaction stats:', err)
    error.value = err.response?.data?.message || 'Failed to load chart data'
    stats.value = {
      daily: [],
      categories: []
    }
  } finally {
    loading.value = false
  }
}

// Watch for period changes
watch(selectedPeriod, () => {
  fetchStats()
})

// Initial fetch
onMounted(() => {
  fetchStats()
  // Listen for transaction added event
  emitter.on('transaction-added', fetchStats)
})

onUnmounted(() => {
  // Clean up event listener
  emitter.off('transaction-added', fetchStats)
})
</script>

<style scoped lang="scss">
.charts-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-shrink: 0;

  h2 {
    color: #2d3748;
    font-size: 1.25rem;
    margin: 0;
  }
}

.period-select {
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

.charts-grid {
  flex: 1;
  display: grid;
  grid-template-rows: auto auto;
  gap: 2rem;
  overflow-y: auto;
  padding-right: 0.5rem;
  min-height: 0;
}

.chart-wrapper {
  position: relative;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  height: 400px;
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;

  h3 {
    color: #4a5568;
    font-size: 1rem;
    font-weight: 500;
    margin: 0 0 1.5rem 0;
  }
}

.chart-container {
  position: relative;
  flex: 1;
  min-height: 320px;
  width: 100%;
  margin-top: 0.5rem;

  .chart {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #718096;
  font-size: 0.875rem;
  text-align: center;
  padding: 2rem;
}

.error-state {
  color: #e53e3e;
}

.charts-grid::-webkit-scrollbar {
  width: 8px;
}

.charts-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.charts-grid::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.charts-grid::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

@media (max-width: 640px) {
  .charts-grid {
    grid-template-rows: auto auto;
    gap: 1.5rem;
    padding-right: 0.5rem;
  }

  .chart-wrapper {
    height: 400px;
  }
}
</style> 