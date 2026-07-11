<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMachineStatus, type MachineStatus } from '@/api/kiosk'

const route = useRoute()
const router = useRouter()

const workstation = computed(() => String(route.params.workstation))
const status = ref<MachineStatus | null>(null)

const STAGES = ['금형예열', '압출작업', '절단작업']
const STAGE_ICON: Record<string, string> = {
  금형예열: 'mdi-fire',
  압출작업: 'mdi-arrow-collapse-right',
  절단작업: 'mdi-content-cut',
}

const refresh = async () => {
  status.value = await getMachineStatus(workstation.value)
}

let timer: number | undefined

onMounted(async () => {
  await refresh()
  timer = window.setInterval(refresh, 5000)
})

onUnmounted(() => {
  window.clearInterval(timer)
})

const selectStage = (stage: string) => {
  if (!status.value?.available[stage]) return
  router.push(`/kiosk/${encodeURIComponent(workstation.value)}/${encodeURIComponent(stage)}`)
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

  <v-card v-if="status?.work_order" variant="tonal" color="primary" class="pa-4 mb-6">
    <div class="text-h6">작업지시: {{ status.work_order }}</div>
    <div v-if="status.item_name" class="text-body-1">{{ status.item_name }} · {{ status.qty }}개</div>
  </v-card>
  <v-card v-else-if="status" variant="tonal" color="grey" class="pa-4 mb-6">
    <div class="text-h6">진행 가능한 작업지시가 없습니다.</div>
  </v-card>

  <v-row>
    <v-col v-for="stage in STAGES" :key="stage" cols="12" md="4">
      <v-card
        :disabled="!status?.available[stage]"
        :color="status?.available[stage] ? 'primary' : undefined"
        :variant="status?.available[stage] ? 'tonal' : 'outlined'"
        class="pa-8 text-center stage-card"
        @click="selectStage(stage)"
      >
        <v-icon :icon="STAGE_ICON[stage]" size="64" class="mb-4" />
        <div class="text-h4 font-weight-bold mb-2">{{ stage }}</div>
        <div v-if="status && !status.available[stage]" class="text-body-1 text-medium-emphasis">
          {{ status.reasons[stage] }}
        </div>
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
