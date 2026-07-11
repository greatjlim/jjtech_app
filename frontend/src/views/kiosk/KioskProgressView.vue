<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { completeProcess, getMachineStatus, startProcess } from '@/api/kiosk'
import { ApiError } from '@/api/client'

const route = useRoute()
const router = useRouter()

const workstation = computed(() => String(route.params.workstation))
const processType = computed(() => String(route.params.processType))

const processLogName = ref('')
const startTime = ref<Date | null>(null)
const now = ref(new Date())
const loading = ref(true)
const errorMessage = ref('')

const showCompleteDialog = ref(false)
const qty = ref<number | null>(null)
const completing = ref(false)

let tickTimer: number | undefined

const elapsedLabel = computed(() => {
  if (!startTime.value) return '00:00:00'
  const diffMs = Math.max(0, now.value.getTime() - startTime.value.getTime())
  const totalSeconds = Math.floor(diffMs / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
})

onMounted(async () => {
  try {
    const status = await getMachineStatus(workstation.value)
    const existing = status.logs.find((log) => log.process_type === processType.value && log.status === '진행중')
    if (existing) {
      processLogName.value = existing.name
      startTime.value = new Date(existing.start_time.replace(' ', 'T'))
    } else {
      const created = await startProcess(workstation.value, processType.value)
      processLogName.value = created.name
      startTime.value = new Date(created.start_time.replace(' ', 'T'))
    }
  } catch (e) {
    errorMessage.value = e instanceof ApiError ? e.message : '공정을 시작할 수 없습니다.'
  } finally {
    loading.value = false
  }

  tickTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  window.clearInterval(tickTimer)
})

const openComplete = () => {
  showCompleteDialog.value = true
}

const confirmComplete = async () => {
  completing.value = true
  try {
    await completeProcess(processLogName.value, qty.value ?? undefined)
    router.push(`/kiosk/${encodeURIComponent(workstation.value)}`)
  } catch (e) {
    errorMessage.value = e instanceof ApiError ? e.message : '완료 처리에 실패했습니다.'
    showCompleteDialog.value = false
  } finally {
    completing.value = false
  }
}

const goBack = () => {
  router.push(`/kiosk/${encodeURIComponent(workstation.value)}`)
}
</script>

<template>
  <div class="d-flex align-center mb-6">
    <v-btn icon="mdi-arrow-left" size="x-large" variant="text" @click="goBack" />
    <h1 class="text-h4 font-weight-bold ml-2">{{ workstation }} · {{ processType }}</h1>
  </div>

  <v-alert v-if="errorMessage" type="error" class="mb-6">{{ errorMessage }}</v-alert>

  <v-card v-if="!loading && !errorMessage" variant="tonal" color="warning" class="pa-10 text-center">
    <div class="text-h5 mb-4">진행 시간</div>
    <div class="text-h1 font-weight-bold mb-8">{{ elapsedLabel }}</div>
    <v-btn color="success" size="x-large" height="80" min-width="240" @click="openComplete">
      <v-icon start size="32">mdi-check-bold</v-icon>
      <span class="text-h5">완료</span>
    </v-btn>
  </v-card>

  <v-dialog v-model="showCompleteDialog" max-width="480" persistent>
    <v-card class="pa-4">
      <v-card-title class="text-h5">{{ processType }} 완료</v-card-title>
      <v-card-text>
        <v-text-field
          v-model.number="qty"
          label="수량"
          type="number"
          variant="outlined"
          density="comfortable"
          autofocus
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn size="large" height="64" variant="text" @click="showCompleteDialog = false">취소</v-btn>
        <v-btn size="large" height="64" color="success" :loading="completing" @click="confirmComplete">확인</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
