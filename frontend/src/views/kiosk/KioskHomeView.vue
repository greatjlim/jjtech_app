<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMachineStatus, type MachineStatus } from '@/api/kiosk'
import { listWorkstations } from '@/api/workOrder'

const router = useRouter()
const workstations = ref<string[]>([])
const statuses = ref<Record<string, MachineStatus>>({})

const STAGE_LABEL: Record<string, string> = {
  금형예열: '예열중',
  압출작업: '압출중',
  절단작업: '절단중',
}

const cardInfo = (workstation: string) => {
  const status = statuses.value[workstation]
  if (!status) return { label: '조회중', color: 'grey' }
  if (status.stage_status === 'no_work_order') return { label: '대기중', color: 'grey' }
  if (status.stage_status === 'done') return { label: '완료', color: 'success' }
  if (status.stage_status === 'in_progress' && status.current_stage) {
    return { label: STAGE_LABEL[status.current_stage] ?? status.current_stage, color: 'warning' }
  }
  return { label: '작업대기', color: 'info' }
}

const refreshAll = async () => {
  const results = await Promise.all(workstations.value.map((ws) => getMachineStatus(ws)))
  const map: Record<string, MachineStatus> = {}
  workstations.value.forEach((ws, idx) => {
    map[ws] = results[idx]
  })
  statuses.value = map
}

let timer: number | undefined

onMounted(async () => {
  workstations.value = await listWorkstations()
  await refreshAll()
  timer = window.setInterval(refreshAll, 5000)
})

onUnmounted(() => {
  window.clearInterval(timer)
})

const openMachine = (workstation: string) => {
  router.push(`/kiosk/${encodeURIComponent(workstation)}`)
}
</script>

<template>
  <div class="text-center mb-8">
    <h1 class="text-h3 font-weight-bold">설비를 선택하세요</h1>
  </div>
  <v-row justify="center">
    <v-col v-for="ws in workstations" :key="ws" cols="12" sm="6" md="5" lg="4">
      <v-card :color="cardInfo(ws).color" variant="tonal" class="pa-8 text-center kiosk-card" @click="openMachine(ws)">
        <div class="text-h3 font-weight-bold mb-4">{{ ws }}</div>
        <div class="text-h4 font-weight-bold mb-2">{{ cardInfo(ws).label }}</div>
        <div v-if="statuses[ws]?.work_order" class="text-h6">작업지시: {{ statuses[ws].work_order }}</div>
        <div v-if="statuses[ws]?.item_name" class="text-body-1 text-medium-emphasis mt-1">
          {{ statuses[ws].item_name }} · {{ statuses[ws].qty }}개
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.kiosk-card {
  cursor: pointer;
  min-height: 260px;
}
</style>
