<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const workstation = computed(() => String(route.params.workstation))

const STAGES = ['금형예열', '절단작업']
const STAGE_ICON: Record<string, string> = {
  금형예열: 'mdi-fire',
  절단작업: 'mdi-content-cut',
}
const STAGE_PATH: Record<string, string> = {
  금형예열: 'preheat',
  절단작업: 'cutting',
}

const selectStage = (stage: string) => {
  router.push(`/kiosk/${encodeURIComponent(workstation.value)}/${STAGE_PATH[stage]}`)
}

const goBack = () => {
  router.push('/kiosk')
}
</script>

<template>
  <div class="d-flex align-center mb-6">
    <v-btn icon="mdi-arrow-left" size="x-large" variant="text" @click="goBack" />
    <h1 class="text-h4 font-weight-bold ml-2">{{ workstation }}</h1>
  </div>

  <v-row>
    <v-col v-for="stage in STAGES" :key="stage" cols="12" md="6">
      <v-card color="primary" variant="tonal" class="pa-8 text-center stage-card" @click="selectStage(stage)">
        <v-icon :icon="STAGE_ICON[stage]" size="64" class="mb-4" />
        <div class="text-h4 font-weight-bold mb-2">{{ stage }}</div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.stage-card {
  cursor: pointer;
  min-height: 260px;
}
</style>
