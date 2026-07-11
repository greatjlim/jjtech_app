<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import { authStore, authActions } from '@/stores/auth'
import { tabsActions } from '@/stores/tabs'
import { getMyTheme, setMyTheme } from '@/api/theme'
import { THEME_DARK, THEME_LIGHT } from '@/plugins/vuetify'
import TabStrip from '@/components/TabStrip.vue'

const route = useRoute()
const router = useRouter()
const drawer = ref(true)
const rail = ref(false)
const theme = useTheme()
const isDark = ref(false)

// v-list-group을 쓰면 rail(사이드바 접기) 상태에서 하위 항목이 통째로 숨어버려서,
// 펼쳐둔 그룹의 화면 아이콘이 접었을 때도 계속 보이도록 열림 상태를 직접 관리한다.
const openGroups = ref<Record<string, boolean>>({
  기준정보: true,
  영업: true,
  생산: true,
  재고: true,
})
const toggleGroup = (name: string) => {
  openGroups.value[name] = !openGroups.value[name]
}

tabsActions.syncFromRoute(route)
watch(
  () => route.path,
  () => tabsActions.syncFromRoute(route),
)

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

const goHome = () => {
  tabsActions.goHome(router)
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-nav-icon class="hidden-lg-and-up" @click="drawer = !drawer" />
      <v-btn icon variant="text" class="hidden-md-and-down" @click="rail = !rail">
        <v-icon>{{ rail ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
      </v-btn>
      <div class="text-h6 font-weight-bold font-italic ml-2" style="cursor: pointer" @click="goHome">JJTech</div>
      <v-spacer />
      <v-btn icon variant="text" @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" :rail="rail" rail-width="72" app>
      <v-list nav>
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="대시보드" />

        <v-list-item
          prepend-icon="mdi-folder-outline"
          title="기준정보"
          :append-icon="rail ? undefined : openGroups['기준정보'] ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          @click="toggleGroup('기준정보')"
        />
        <v-expand-transition>
          <div v-show="openGroups['기준정보']">
            <v-list-item to="/companies" prepend-icon="mdi-domain" title="회사 관리" :class="!rail ? 'pl-8' : ''" />
            <v-list-item to="/customers" prepend-icon="mdi-account-group" title="거래처 관리" :class="!rail ? 'pl-8' : ''" />
            <v-list-item to="/suppliers" prepend-icon="mdi-account-hard-hat" title="공급업체관리" :class="!rail ? 'pl-8' : ''" />
            <v-list-item to="/items" prepend-icon="mdi-cube-outline" title="물품관리" :class="!rail ? 'pl-8' : ''" />
            <v-list-item to="/molds" prepend-icon="mdi-hammer-wrench" title="금형관리" :class="!rail ? 'pl-8' : ''" />
          </div>
        </v-expand-transition>

        <v-list-item
          prepend-icon="mdi-briefcase-outline"
          title="영업"
          :append-icon="rail ? undefined : openGroups['영업'] ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          @click="toggleGroup('영업')"
        />
        <v-expand-transition>
          <div v-show="openGroups['영업']">
            <v-list-item to="/sales-orders" prepend-icon="mdi-clipboard-text" title="주문관리" :class="!rail ? 'pl-8' : ''" />
            <v-list-item to="/shipments" prepend-icon="mdi-truck-delivery" title="출고관리" :class="!rail ? 'pl-8' : ''" />
          </div>
        </v-expand-transition>

        <v-list-item
          prepend-icon="mdi-cog-outline"
          title="생산"
          :append-icon="rail ? undefined : openGroups['생산'] ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          @click="toggleGroup('생산')"
        />
        <v-expand-transition>
          <div v-show="openGroups['생산']">
            <v-list-item to="/work-orders" prepend-icon="mdi-factory" title="작업지시" :class="!rail ? 'pl-8' : ''" />
          </div>
        </v-expand-transition>

        <v-list-item
          prepend-icon="mdi-warehouse"
          title="재고"
          :append-icon="rail ? undefined : openGroups['재고'] ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          @click="toggleGroup('재고')"
        />
        <v-expand-transition>
          <div v-show="openGroups['재고']">
            <v-list-item to="/purchase-orders" prepend-icon="mdi-cart-arrow-down" title="발주관리" :class="!rail ? 'pl-8' : ''" />
            <v-list-item to="/purchase-receipts" prepend-icon="mdi-package-variant-closed" title="입고관리" :class="!rail ? 'pl-8' : ''" />
            <v-list-item to="/stock" prepend-icon="mdi-warehouse" title="재고관리" :class="!rail ? 'pl-8' : ''" />
          </div>
        </v-expand-transition>

        <!-- 설정: 화면 추가되면 여기에 위와 동일한 패턴(헤더 v-list-item + openGroups['설정'] 토글)으로 추가 -->
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
      <TabStrip />
      <v-container fluid>
        <router-view v-slot="{ Component, route: currentRoute }">
          <keep-alive>
            <component :is="Component" :key="currentRoute.path" />
          </keep-alive>
        </router-view>
      </v-container>
    </v-main>
  </v-app>
</template>
