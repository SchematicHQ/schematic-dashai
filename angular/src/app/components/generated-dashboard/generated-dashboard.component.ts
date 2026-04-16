import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-generated-dashboard',
  imports: [BaseChartDirective],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">Generated Dashboard</h2>
          <p class="text-sm text-muted-foreground">
            Business performance overview
          </p>
        </div>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          Live data
        </div>
      </div>

      <!-- Metric Cards -->
      <div class="grid grid-cols-4 gap-4">
        @for (metric of metrics; track metric.label) {
          <div class="rounded-lg border border-border bg-card p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-muted-foreground">{{ metric.label }}</p>
                <p class="text-2xl font-bold">{{ metric.value }}</p>
                <div class="flex items-center gap-1 mt-1">
                  <span
                    class="text-xs"
                    [class.text-green-500]="metric.positive"
                    [class.text-red-500]="!metric.positive"
                  >
                    {{ metric.change }}
                  </span>
                </div>
              </div>
              <div
                class="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent"
              >
                {{ metric.icon }}
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Charts Row 1 -->
      <div class="grid grid-cols-2 gap-6">
        <div class="rounded-lg border border-border bg-card">
          <div class="p-4 pb-2">
            <h3 class="text-base font-semibold">Revenue vs Target</h3>
            <p class="text-sm text-muted-foreground">
              Monthly performance comparison
            </p>
          </div>
          <div class="p-4 h-[280px]">
            <canvas
              baseChart
              [type]="'line'"
              [data]="revenueChartData"
              [options]="chartOptions"
            ></canvas>
          </div>
        </div>

        <div class="rounded-lg border border-border bg-card">
          <div class="p-4 pb-2">
            <h3 class="text-base font-semibold">User Activity</h3>
            <p class="text-sm text-muted-foreground">
              Daily active and new users
            </p>
          </div>
          <div class="p-4 h-[280px]">
            <canvas
              baseChart
              [type]="'bar'"
              [data]="userActivityChartData"
              [options]="chartOptions"
            ></canvas>
          </div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="grid grid-cols-3 gap-6">
        <div class="rounded-lg border border-border bg-card">
          <div class="p-4 pb-2">
            <h3 class="text-base font-semibold">Traffic Sources</h3>
            <p class="text-sm text-muted-foreground">
              Where your visitors come from
            </p>
          </div>
          <div class="p-4 h-[240px]">
            <canvas
              baseChart
              [type]="'doughnut'"
              [data]="trafficChartData"
              [options]="pieOptions"
            ></canvas>
          </div>
          <div class="px-4 pb-4 grid grid-cols-2 gap-2">
            @for (item of trafficSources; track item.name) {
              <div class="flex items-center gap-2">
                <div
                  class="h-2 w-2 rounded-full"
                  [style.background-color]="item.color"
                ></div>
                <span class="text-xs text-muted-foreground">{{
                  item.name
                }}</span>
                <span class="text-xs font-medium ml-auto"
                  >{{ item.value }}%</span
                >
              </div>
            }
          </div>
        </div>

        <div class="col-span-2 rounded-lg border border-border bg-card">
          <div class="p-4 pb-2">
            <h3 class="text-base font-semibold">Conversion Funnel</h3>
            <p class="text-sm text-muted-foreground">
              Weekly visitor to purchase journey
            </p>
          </div>
          <div class="p-4 h-[240px]">
            <canvas
              baseChart
              [type]="'line'"
              [data]="conversionChartData"
              [options]="chartOptions"
            ></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class GeneratedDashboardComponent {
  metrics = [
    {
      label: 'Total Revenue',
      value: '$43,900',
      change: '+12.5%',
      positive: true,
      icon: '$',
    },
    {
      label: 'Active Users',
      value: '8,234',
      change: '+8.2%',
      positive: true,
      icon: '\u{1F465}',
    },
    {
      label: 'Orders',
      value: '1,429',
      change: '-3.1%',
      positive: false,
      icon: '\u{1F6D2}',
    },
    {
      label: 'Conversion',
      value: '3.24%',
      change: '+0.4%',
      positive: true,
      icon: '\u{26A1}',
    },
  ];

  trafficSources = [
    { name: 'Organic', value: 42, color: '#6366f1' },
    { name: 'Direct', value: 28, color: '#22c55e' },
    { name: 'Referral', value: 18, color: '#f59e0b' },
    { name: 'Social', value: 12, color: '#ec4899' },
  ];

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: '#333' },
        ticks: { color: '#666', font: { size: 12 } },
      },
      y: {
        grid: { color: '#333' },
        ticks: { color: '#666', font: { size: 12 } },
      },
    },
    plugins: { legend: { display: false } },
  };

  pieOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  revenueChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'Target',
        data: [4000, 4200, 4400, 4600, 4800, 5000, 5200, 5400],
        borderColor: '#404040',
        backgroundColor: 'rgba(64,64,64,0.3)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Revenue',
        data: [4200, 3800, 5100, 4900, 6200, 5800, 7100, 6800],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.5)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  userActivityChartData: ChartConfiguration<'bar'>['data'] = {
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
  };

  trafficChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Organic', 'Direct', 'Referral', 'Social'],
    datasets: [
      {
        data: [42, 28, 18, 12],
        backgroundColor: ['#6366f1', '#22c55e', '#f59e0b', '#ec4899'],
      },
    ],
  };

  conversionChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [
      {
        label: 'Visitors',
        data: [1200, 1400, 1100, 1600],
        borderColor: '#666',
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Signups',
        data: [120, 150, 98, 180],
        borderColor: '#6366f1',
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Purchases',
        data: [45, 52, 38, 68],
        borderColor: '#22c55e',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };
}
