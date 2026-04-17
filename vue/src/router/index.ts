import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/pages/HomePage.vue') },
    { path: '/dashboard', component: () => import('@/pages/DashboardPage.vue') },
    { path: '/team', component: () => import('@/pages/TeamPage.vue') },
    { path: '/data-sources', component: () => import('@/pages/DataSourcesPage.vue') },
    { path: '/plan', component: () => import('@/pages/PlanPage.vue') },
    { path: '/pricing', component: () => import('@/pages/PricingPage.vue') },
  ],
})

export default router
