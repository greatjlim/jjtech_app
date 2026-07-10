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
