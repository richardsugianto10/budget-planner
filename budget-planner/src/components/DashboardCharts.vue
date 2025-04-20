<template>
  <div class="charts-container">
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

const props = defineProps<{
  period: string
}>()

const authStore = useAuthStore()
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
        callback: function(tickValue: number | string) {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(Number(tickValue))
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
    console.log('Fetching stats for period:', props.period)
    const response = await axios.get(`http://localhost:3000/api/transactions/stats?period=${props.period}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    console.log('Stats response:', response.data)
    
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

// Watch for period changes from parent
watch(() => props.period, () => {
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
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-sizing: border-box;
}

.charts-grid {
  flex: 1;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 1.5rem;
  min-height: 0;
  width: 100%;
}

.chart-wrapper {
  width: 100%;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  box-sizing: border-box;

  h3 {
    color: #4a5568;
    font-size: 1rem;
    font-weight: 500;
    margin: 0 0 1rem 0;
  }
}

.chart-container {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 250px;

  .chart {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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
  padding: 1rem;
}

.error-state {
  color: #e53e3e;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-rows: auto auto;
    gap: 1rem;
  }

  .chart-wrapper {
    min-height: 250px;
    padding: 1rem;
  }
}
</style> 