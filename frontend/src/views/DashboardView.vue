<script setup lang="ts">
import { authStore } from '@/stores/auth'
</script>

<template>
  <v-card class="pa-8" max-width="480">
    <v-card-title class="text-h5 font-weight-bold">
      환영합니다, {{ authStore.fullName }}님
    </v-card-title>
    <v-card-text class="text-body-1 text-medium-emphasis">
      JJTech 업무 시스템에 오신 것을 환영합니다.
    </v-card-text>
  </v-card>
</template>
