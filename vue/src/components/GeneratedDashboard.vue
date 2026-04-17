<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Activity,
} from 'lucide-vue-next'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
)

// Shared chart options for dark theme
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'oklch(0.16 0 0)',
      borderColor: 'oklch(0.28 0 0)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#aaa',
      padding: 8,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: '#333' },
      ticks: { color: '#666', font: { size: 12 } },
      border: { display: false },
    },
    y: {
      grid: { color: '#333' },
      ticks: { color: '#666', font: { size: 12 } },
      border: { display: false },
    },
  },
}

// Revenue vs Target (Area chart = Line with fill)
const revenueData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
  datasets: [
    {
      label: 'Target',
      data: [4000, 4200, 4400, 4600, 4800, 5000, 5200, 5400],
      borderColor: '#404040',
      backgroundColor: 'rgba(64, 64, 64, 0.3)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    },
    {
      label: 'Revenue',
      data: [4200, 3800, 5100, 4900, 6200, 5800, 7100, 6800],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    },
  ],
}

// User Activity (Bar chart)
const userActivityData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Active Users',
      data: [2400, 1398, 9800, 3908, 4800, 3800, 4300],
      backgroundColor: '#22c55e',
      borderRadius: 4,
    },
    {
      label: 'New Users',
      data: [400, 300, 500, 480, 380, 430, 340],
      backgroundColor: '#6366f1',
      borderRadius: 4,
    },
  ],
}

// Traffic Sources (Doughnut chart)
const trafficData = {
  labels: ['Organic', 'Direct', 'Referral', 'Social'],
  datasets: [
    {
      data: [42, 28, 18, 12],
      backgroundColor: ['#6366f1', '#22c55e', '#f59e0b', '#ec4899'],
      borderWidth: 0,
    },
  ],
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'oklch(0.16 0 0)',
      borderColor: 'oklch(0.28 0 0)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#aaa',
      padding: 8,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: { label: string; parsed: number }) => `${ctx.label}: ${ctx.parsed}%`,
      },
    },
  },
}

// Conversion Funnel (Line chart)
const conversionData = {
  labels: ['W1', 'W2', 'W3', 'W4'],
  datasets: [
    {
      label: 'Visitors',
      data: [1200, 1400, 1100, 1600],
      borderColor: '#666',
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
    {
      label: 'Signups',
      data: [120, 150, 98, 180],
      borderColor: '#6366f1',
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
    {
      label: 'Purchases',
      data: [45, 52, 38, 68],
      borderColor: '#22c55e',
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
  ],
}

const trafficLegend = [
  { name: 'Organic', value: 42, color: '#6366f1' },
  { name: 'Direct', value: 28, color: '#22c55e' },
  { name: 'Referral', value: 18, color: '#f59e0b' },
  { name: 'Social', value: 12, color: '#ec4899' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Generated Dashboard</h2>
        <p class="text-sm text-muted-foreground">Business performance overview</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <div class="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        Live data
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-muted-foreground">Total Revenue</p>
            <p class="text-2xl font-bold">$43,900</p>
            <div class="flex items-center gap-1 mt-1">
              <TrendingUp :size="12" class="text-green-500" />
              <span class="text-xs text-green-500">+12.5%</span>
            </div>
          </div>
          <div class="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <DollarSign :size="20" class="text-accent" />
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-muted-foreground">Active Users</p>
            <p class="text-2xl font-bold">8,234</p>
            <div class="flex items-center gap-1 mt-1">
              <TrendingUp :size="12" class="text-green-500" />
              <span class="text-xs text-green-500">+8.2%</span>
            </div>
          </div>
          <div class="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Users :size="20" class="text-accent" />
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-muted-foreground">Orders</p>
            <p class="text-2xl font-bold">1,429</p>
            <div class="flex items-center gap-1 mt-1">
              <TrendingDown :size="12" class="text-red-500" />
              <span class="text-xs text-red-500">-3.1%</span>
            </div>
          </div>
          <div class="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <ShoppingCart :size="20" class="text-accent" />
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-muted-foreground">Conversion</p>
            <p class="text-2xl font-bold">3.24%</p>
            <div class="flex items-center gap-1 mt-1">
              <TrendingUp :size="12" class="text-green-500" />
              <span class="text-xs text-green-500">+0.4%</span>
            </div>
          </div>
          <div class="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Activity :size="20" class="text-accent" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid grid-cols-2 gap-6">
      <div class="rounded-lg border border-border bg-card">
        <div class="p-4 pb-2">
          <h3 class="text-base font-semibold">Revenue vs Target</h3>
          <p class="text-sm text-muted-foreground">Monthly performance comparison</p>
        </div>
        <div class="p-4 h-[250px]">
          <Line :data="revenueData" :options="baseOptions" />
        </div>
      </div>

      <div class="rounded-lg border border-border bg-card">
        <div class="p-4 pb-2">
          <h3 class="text-base font-semibold">User Activity</h3>
          <p class="text-sm text-muted-foreground">Daily active and new users</p>
        </div>
        <div class="p-4 h-[250px]">
          <Bar :data="userActivityData" :options="baseOptions" />
        </div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid grid-cols-3 gap-6">
      <div class="rounded-lg border border-border bg-card">
        <div class="p-4 pb-2">
          <h3 class="text-base font-semibold">Traffic Sources</h3>
          <p class="text-sm text-muted-foreground">Where your visitors come from</p>
        </div>
        <div class="p-4">
          <div class="h-[200px]">
            <Doughnut :data="trafficData" :options="doughnutOptions" />
          </div>
          <div class="grid grid-cols-2 gap-2 mt-4">
            <div
              v-for="item in trafficLegend"
              :key="item.name"
              class="flex items-center gap-2"
            >
              <div
                class="h-2 w-2 rounded-full"
                :style="{ backgroundColor: item.color }"
              />
              <span class="text-xs text-muted-foreground">{{ item.name }}</span>
              <span class="text-xs font-medium ml-auto">{{ item.value }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-2 rounded-lg border border-border bg-card">
        <div class="p-4 pb-2">
          <h3 class="text-base font-semibold">Conversion Funnel</h3>
          <p class="text-sm text-muted-foreground">Weekly visitor to purchase journey</p>
        </div>
        <div class="p-4 h-[200px]">
          <Line :data="conversionData" :options="baseOptions" />
        </div>
      </div>
    </div>
  </div>
</template>
