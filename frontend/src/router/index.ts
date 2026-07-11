import { createRouter, createWebHistory } from 'vue-router'
import { authStore, authActions } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: { name: 'dashboard' } },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'companies',
          name: 'companies',
          component: () => import('@/views/CompanyListView.vue'),
        },
        {
          path: 'companies/:name',
          name: 'company-detail',
          component: () => import('@/views/CompanyDetailView.vue'),
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/views/CustomerListView.vue'),
        },
        {
          path: 'items',
          name: 'items',
          component: () => import('@/views/ItemListView.vue'),
        },
        {
          path: 'molds',
          name: 'molds',
          component: () => import('@/views/MoldManagementView.vue'),
        },
        {
          path: 'sales-orders',
          name: 'sales-orders',
          component: () => import('@/views/SalesOrderListView.vue'),
        },
        {
          path: 'work-orders',
          name: 'work-orders',
          component: () => import('@/views/WorkOrderListView.vue'),
        },
      ],
    },
    {
      path: '/kiosk',
      component: () => import('@/layouts/KioskLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'kiosk-home',
          component: () => import('@/views/kiosk/KioskHomeView.vue'),
        },
        {
          path: ':workstation/preheat',
          name: 'kiosk-preheat-board',
          component: () => import('@/views/kiosk/KioskPreheatBoardView.vue'),
        },
        {
          path: ':workstation/extrusion/:mold',
          name: 'kiosk-extrusion',
          component: () => import('@/views/kiosk/KioskExtrusionView.vue'),
        },
        {
          path: ':workstation/cutting',
          name: 'kiosk-cutting',
          component: () => import('@/views/kiosk/KioskCuttingView.vue'),
        },
        {
          path: ':workstation/packaging',
          name: 'kiosk-packaging',
          component: () => import('@/views/kiosk/KioskPackagingView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (!authStore.ready) {
    authActions.checkSession()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { path: '/' }
  }
})

export default router
