import { createRouter, createWebHistory } from 'vue-router'
import { authStore, authActions } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    tabTitle?: string
    tabIcon?: string
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
          meta: { tabTitle: '대시보드', tabIcon: 'mdi-view-dashboard' },
        },
        {
          path: 'companies',
          name: 'companies',
          component: () => import('@/views/CompanyListView.vue'),
          meta: { tabTitle: '회사 관리', tabIcon: 'mdi-domain' },
        },
        {
          path: 'companies/:name',
          name: 'company-detail',
          component: () => import('@/views/CompanyDetailView.vue'),
          meta: { tabTitle: '회사 상세', tabIcon: 'mdi-domain' },
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/views/CustomerListView.vue'),
          meta: { tabTitle: '거래처 관리', tabIcon: 'mdi-account-group' },
        },
        {
          path: 'suppliers',
          name: 'suppliers',
          component: () => import('@/views/SupplierListView.vue'),
          meta: { tabTitle: '공급업체관리', tabIcon: 'mdi-account-hard-hat' },
        },
        {
          path: 'items',
          name: 'items',
          component: () => import('@/views/ItemListView.vue'),
          meta: { tabTitle: '물품관리', tabIcon: 'mdi-cube-outline' },
        },
        {
          path: 'molds',
          name: 'molds',
          component: () => import('@/views/MoldManagementView.vue'),
          meta: { tabTitle: '금형관리', tabIcon: 'mdi-hammer-wrench' },
        },
        {
          path: 'sales-orders',
          name: 'sales-orders',
          component: () => import('@/views/SalesOrderListView.vue'),
          meta: { tabTitle: '주문관리', tabIcon: 'mdi-clipboard-text' },
        },
        {
          path: 'work-orders',
          name: 'work-orders',
          component: () => import('@/views/WorkOrderListView.vue'),
          meta: { tabTitle: '작업지시', tabIcon: 'mdi-factory' },
        },
        {
          path: 'shipments',
          name: 'shipments',
          component: () => import('@/views/ShipmentListView.vue'),
          meta: { tabTitle: '출고관리', tabIcon: 'mdi-truck-delivery' },
        },
        {
          path: 'stock',
          name: 'stock',
          component: () => import('@/views/StockListView.vue'),
          meta: { tabTitle: '재고관리', tabIcon: 'mdi-warehouse' },
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
