<script setup lang="ts">
import { useRouter } from 'vue-router'
import { authActions } from '@/stores/auth'

const router = useRouter()

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
    <v-app-bar color="primary" elevation="2" height="56">
      <div class="text-h6 font-weight-bold font-italic ml-4">JJTech 공장 키오스크</div>
      <v-spacer />
      <v-btn variant="text" size="large" @click="logout">
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
