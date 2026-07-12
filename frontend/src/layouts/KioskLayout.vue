<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { authActions } from '@/stores/auth'
import { THEME_KIOSK } from '@/plugins/vuetify'

const router = useRouter()
const theme = useTheme()

const previousTheme = theme.global.name.value
theme.global.name.value = THEME_KIOSK
onUnmounted(() => {
  theme.global.name.value = previousTheme
})

const now = ref(new Date())
let clockTimer: number | undefined
onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onUnmounted(() => {
  window.clearInterval(clockTimer)
})

const clockLabel = () =>
  now.value.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const dateLabel = () =>
  now.value.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })

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
    <v-app-bar color="surface" elevation="4" height="76">
      <div class="d-flex align-center ml-5" style="gap: 12px">
        <v-icon size="32" color="primary">mdi-factory</v-icon>
        <div class="text-h5 font-weight-bold">JJTech 공장 키오스크</div>
      </div>
      <v-spacer />
      <div class="text-right mr-6" style="font-variant-numeric: tabular-nums">
        <div class="text-h5 font-weight-bold">{{ clockLabel() }}</div>
        <div class="text-caption text-medium-emphasis">{{ dateLabel() }}</div>
      </div>
      <v-btn variant="tonal" color="error" size="large" height="48" class="mr-4" @click="logout">
        <v-icon start>mdi-logout</v-icon>
        로그아웃
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
