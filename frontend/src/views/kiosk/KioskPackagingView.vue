<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const workstation = computed(() => String(route.params.workstation))

const goBack = () => {
  router.push('/kiosk')
}
</script>

<template>
  <div class="d-flex align-center mb-6">
    <v-btn icon="mdi-arrow-left" size="x-large" variant="text" @click="goBack" />
    <h1 class="text-h4 font-weight-bold ml-2">{{ workstation }} 포장등록</h1>
  </div>

  <v-card variant="tonal" color="grey" class="pa-8 text-center">
    <v-icon icon="mdi-package-variant-closed" size="64" class="mb-4" />
    <div class="text-h5 font-weight-bold">준비 중입니다</div>
    <div class="text-body-1 text-medium-emphasis mt-2">포장등록 화면은 다음에 만들 예정입니다.</div>
  </v-card>
</template>
