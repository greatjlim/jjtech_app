<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore, authActions } from '@/stores/auth'

const router = useRouter()
const drawer = ref(true)

const logout = async () => {
  try {
    await authActions.logout()
  } finally {
    router.push('/login')
  }
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-nav-icon class="hidden-lg-and-up" @click="drawer = !drawer" />
      <div class="text-h6 font-weight-bold font-italic ml-2">JJTech</div>
      <v-spacer />
      <span class="text-body-2 mr-4">{{ authStore.fullName }}</span>
      <v-btn variant="text" @click="logout">
        <v-icon start>mdi-logout</v-icon>
        로그아웃
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app>
      <v-list nav>
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="대시보드" />
        <v-list-item to="/companies" prepend-icon="mdi-domain" title="회사 관리" />
        <v-list-item to="/customers" prepend-icon="mdi-account-group" title="거래처 관리" />
        <v-list-item to="/molds" prepend-icon="mdi-hammer-wrench" title="금형관리" />
        <v-list-item to="/sales-orders" prepend-icon="mdi-clipboard-text" title="주문관리" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
