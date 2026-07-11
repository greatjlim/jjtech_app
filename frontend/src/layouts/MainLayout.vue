<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { authStore, authActions } from '@/stores/auth'
import { getMyTheme, setMyTheme } from '@/api/theme'
import { THEME_DARK, THEME_LIGHT } from '@/plugins/vuetify'

const router = useRouter()
const drawer = ref(true)
const rail = ref(false)
const theme = useTheme()
const isDark = ref(false)

const initials = computed(() => (authStore.fullName || authStore.user || '?').trim().slice(0, 1).toUpperCase())

onMounted(async () => {
  if (!authStore.user) return
  try {
    const deskTheme = await getMyTheme(authStore.user)
    isDark.value = deskTheme === 'Dark'
    theme.global.name.value = isDark.value ? THEME_DARK : THEME_LIGHT
  } catch {
    // 조회 실패 시 기본 라이트 테마 유지
  }
})

const toggleTheme = async () => {
  isDark.value = !isDark.value
  theme.global.name.value = isDark.value ? THEME_DARK : THEME_LIGHT
  if (authStore.user) {
    try {
      await setMyTheme(authStore.user, isDark.value ? 'Dark' : 'Light')
    } catch {
      // 저장 실패해도 화면 전환 자체는 유지
    }
  }
}

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
      <v-btn icon variant="text" class="hidden-md-and-down" @click="rail = !rail">
        <v-icon>{{ rail ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
      </v-btn>
      <div class="text-h6 font-weight-bold font-italic ml-2">JJTech</div>
      <v-spacer />
      <v-btn icon variant="text" @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" :rail="rail" rail-width="72" app>
      <v-list nav>
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="대시보드" />
        <v-list-item to="/companies" prepend-icon="mdi-domain" title="회사 관리" />
        <v-list-item to="/customers" prepend-icon="mdi-account-group" title="거래처 관리" />
        <v-list-item to="/items" prepend-icon="mdi-cube-outline" title="물품관리" />
        <v-list-item to="/molds" prepend-icon="mdi-hammer-wrench" title="금형관리" />
        <v-list-item to="/sales-orders" prepend-icon="mdi-clipboard-text" title="주문관리" />
        <v-list-item to="/work-orders" prepend-icon="mdi-factory" title="작업지시" />
        <v-list-item to="/shipments" prepend-icon="mdi-truck-delivery" title="출고관리" />
        <v-list-item to="/stock" prepend-icon="mdi-warehouse" title="재고관리" />
      </v-list>

      <template #append>
        <v-divider />
        <div class="d-flex align-center pa-3" :class="rail ? 'justify-center' : ''">
          <v-tooltip v-if="rail" text="로그아웃">
            <template #activator="{ props: tooltipProps }">
              <v-avatar v-bind="tooltipProps" color="primary" size="36" style="cursor: pointer" @click="logout">
                <span class="text-body-2 font-weight-bold">{{ initials }}</span>
              </v-avatar>
            </template>
          </v-tooltip>
          <template v-else>
            <v-avatar color="primary" size="36">
              <span class="text-body-2 font-weight-bold">{{ initials }}</span>
            </v-avatar>
            <div class="ml-3 flex-grow-1 text-truncate">
              <div class="text-body-2 font-weight-medium text-truncate">{{ authStore.fullName }}</div>
            </div>
            <v-tooltip text="로그아웃">
              <template #activator="{ props: tooltipProps }">
                <v-btn v-bind="tooltipProps" icon size="small" variant="text" @click="logout">
                  <v-icon>mdi-logout</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </template>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
