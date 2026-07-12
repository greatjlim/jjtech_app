import { createRouter, createWebHistory } from 'vue-router'
import { authStore, authActions } from '@/stores/auth'
import { permissionsStore, permissionsActions } from '@/stores/permissions'
import { SCREEN_KEYS } from '@/api/screenPermission'

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
          path: 'purchase-orders',
          name: 'purchase-orders',
          component: () => import('@/views/PurchaseOrderListView.vue'),
          meta: { tabTitle: '발주관리', tabIcon: 'mdi-cart-arrow-down' },
        },
        {
          path: 'purchase-receipts',
          name: 'purchase-receipts',
          component: () => import('@/views/PurchaseReceiptListView.vue'),
          meta: { tabTitle: '입고관리', tabIcon: 'mdi-package-variant-closed' },
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
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UserListView.vue'),
          meta: { tabTitle: '사용자관리', tabIcon: 'mdi-account-cog' },
        },
        {
          path: 'role-assignment',
          name: 'role-assignment',
          component: () => import('@/views/RoleAssignmentView.vue'),
          meta: { tabTitle: '권한관리', tabIcon: 'mdi-shield-account' },
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

router.beforeEach(async (to) => {
  if (!authStore.ready) {
    authActions.checkSession()
  }

  // 로그아웃은 항상 /login(guestOnly)으로 이동하는데, 그 라우트는 requiresAuth가
  // 아니라서 아래 분기들을 안 타고 지나간다. 그 상태로 새로고침 없이 다른 계정으로
  // 로그인하면 이전 계정의 permissionsStore(ready=true)가 그대로 남아, 방금
  // 로그인한 계정에도 이전 계정의 화면 권한이 적용되는 문제가 있었다. 그래서
  // 인증 안 된 상태를 발견하는 즉시(목적지 라우트와 무관하게) 리셋한다.
  if (!authStore.isAuthenticated && permissionsStore.ready) {
    permissionsActions.reset()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { path: '/' }
  }

  if (to.meta.requiresAuth && authStore.isAuthenticated) {
    if (!permissionsStore.ready) {
      await permissionsActions.load()
    }
    if (typeof to.name === 'string' && SCREEN_KEYS.includes(to.name) && !permissionsActions.canAccess(to.name)) {
      return { path: '/dashboard' }
    }
  }
})

export default router
