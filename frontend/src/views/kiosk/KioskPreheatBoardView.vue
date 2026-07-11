<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelPreheat,
  changeZone,
  checkoutMold,
  getZoneBoard,
  listAvailableMolds,
  listPreheatEligibleWorkOrders,
  registerPreheat,
  type AvailableMold,
  type PreheatEligibleWorkOrder,
  type ZoneBoard,
  type ZoneJob,
} from '@/api/preheat'
import { ApiError } from '@/api/client'

const route = useRoute()
const router = useRouter()

const workstation = computed(() => String(route.params.workstation))

const ZONE_PANELS: { key: '1' | '2' | '3' | '0'; title: string }[] = [
  { key: '1', title: '1 Zone' },
  { key: '2', title: '2 Zone' },
  { key: '3', title: '3 Zone' },
  { key: '0', title: '대출' },
]

const board = ref<ZoneBoard>({ '1': [], '2': [], '3': [], '0': [] })

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const notify = (message: string, color: 'success' | 'error' = 'success') => {
  snackbarColor.value = color
  snackbarText.value = message
  snackbar.value = true
}

const refreshBoard = async () => {
  board.value = await getZoneBoard(workstation.value)
}

const now = ref(Date.now())

let pollTimer: number | undefined
let tickTimer: number | undefined

onMounted(async () => {
  await refreshBoard()
  pollTimer = window.setInterval(refreshBoard, 5000)
  tickTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  window.clearInterval(pollTimer)
  window.clearInterval(tickTimer)
})

const checkInLabel = (checkInTime: string) => {
  const start = new Date(checkInTime.replace(' ', 'T'))
  return start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const elapsedLabel = (checkInTime: string) => {
  const start = new Date(checkInTime.replace(' ', 'T'))
  const diffMs = Math.max(0, now.value - start.getTime())
  const totalSeconds = Math.floor(diffMs / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

const goBack = () => {
  router.push(`/kiosk/${encodeURIComponent(workstation.value)}`)
}

// 행 액션(대출 / ZONE 변경 / 취소)
const actionJob = ref<ZoneJob | null>(null)
const actionPanel = ref<'1' | '2' | '3' | '0' | null>(null)
const showZonePicker = ref(false)
const acting = ref(false)

const openAction = (job: ZoneJob, panel: '1' | '2' | '3' | '0') => {
  actionJob.value = job
  actionPanel.value = panel
  showZonePicker.value = false
}

const closeAction = () => {
  actionJob.value = null
  actionPanel.value = null
  showZonePicker.value = false
}

const goToExtrusion = () => {
  if (!actionJob.value) return
  router.push(`/kiosk/${encodeURIComponent(workstation.value)}/extrusion/${encodeURIComponent(actionJob.value.mold)}`)
}

const doCheckout = async () => {
  if (!actionJob.value) return
  acting.value = true
  try {
    await checkoutMold(actionJob.value.name)
    notify('대출 처리되었습니다.')
    closeAction()
    await refreshBoard()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '대출 처리에 실패했습니다.', 'error')
  } finally {
    acting.value = false
  }
}

const doChangeZone = async (zone: '1' | '2' | '3') => {
  if (!actionJob.value) return
  acting.value = true
  try {
    await changeZone(actionJob.value.name, zone)
    notify('Zone이 변경되었습니다.')
    closeAction()
    await refreshBoard()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Zone 변경에 실패했습니다.', 'error')
  } finally {
    acting.value = false
  }
}

const doCancel = async () => {
  if (!actionJob.value) return
  const message = actionPanel.value === '0' ? '대출을 취소하시겠습니까?' : '예열을 취소하시겠습니까?'
  if (!window.confirm(message)) return
  acting.value = true
  try {
    await cancelPreheat(actionJob.value.name)
    notify('취소되었습니다.')
    closeAction()
    await refreshBoard()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '취소에 실패했습니다.', 'error')
  } finally {
    acting.value = false
  }
}

// 예열등록 마법사 (작업지시 선택 -> 금형 선택 -> Zone 선택)
const showWizard = ref(false)
const wizardStep = ref(1)
const eligibleWorkOrders = ref<PreheatEligibleWorkOrder[]>([])
const selectedWorkOrder = ref<PreheatEligibleWorkOrder | null>(null)
const availableMolds = ref<AvailableMold[]>([])
const registering = ref(false)

const openWizard = async () => {
  showWizard.value = true
  wizardStep.value = 1
  selectedWorkOrder.value = null
  availableMolds.value = []
  eligibleWorkOrders.value = await listPreheatEligibleWorkOrders(workstation.value)
}

const closeWizard = () => {
  showWizard.value = false
}

const selectWorkOrder = async (wo: PreheatEligibleWorkOrder) => {
  selectedWorkOrder.value = wo
  wizardStep.value = 2
  availableMolds.value = wo.custom_mold ? await listAvailableMolds(wo.custom_mold) : []
}

const backToStep1 = () => {
  wizardStep.value = 1
}

const selectMoldAndGoToZone = () => {
  wizardStep.value = 3
}

const selectedMold = ref<AvailableMold | null>(null)
const chooseMold = (mold: AvailableMold) => {
  selectedMold.value = mold
  selectMoldAndGoToZone()
}

const backToStep2 = () => {
  wizardStep.value = 2
}

const confirmRegister = async (zone: '1' | '2' | '3') => {
  if (!selectedWorkOrder.value || !selectedMold.value) return
  registering.value = true
  try {
    await registerPreheat(selectedWorkOrder.value.name, workstation.value, selectedMold.value.name, zone)
    notify('예열등록 되었습니다.')
    closeWizard()
    await refreshBoard()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '예열등록에 실패했습니다.', 'error')
  } finally {
    registering.value = false
  }
}
</script>

<template>
  <div class="d-flex align-center mb-4">
    <v-btn icon="mdi-arrow-left" size="x-large" variant="text" @click="goBack" />
    <h1 class="text-h4 font-weight-bold ml-2">{{ workstation }} 금형예열</h1>
    <v-spacer />
    <v-btn color="primary" size="large" height="56" @click="openWizard">
      <v-icon start>mdi-plus-circle</v-icon>
      예열등록
    </v-btn>
  </div>

  <v-row>
    <v-col v-for="panel in ZONE_PANELS" :key="panel.key" cols="12" md="6">
      <v-card variant="tonal" :color="panel.key === '0' ? 'success' : 'primary'" class="pa-3">
        <div class="text-h6 font-weight-bold mb-2">{{ panel.title }} ({{ board[panel.key].length }}건)</div>
        <v-card
          v-for="job in board[panel.key]"
          :key="job.name"
          class="pa-3 mb-2"
          @click="openAction(job, panel.key)"
        >
          <div class="d-flex justify-space-between">
            <span class="text-h6 font-weight-bold">{{ job.mold_number }}</span>
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ job.material }} · {{ job.weight }}kg · {{ job.customer_name }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ job.work_order }}</div>
          <div class="d-flex justify-space-between mt-2">
            <span class="text-body-2">입고 {{ checkInLabel(job.check_in_time) }}</span>
            <span class="text-h6 font-weight-bold">예열 {{ elapsedLabel(job.check_in_time) }}</span>
          </div>
        </v-card>
        <div v-if="board[panel.key].length === 0" class="text-center text-medium-emphasis pa-4">비어 있음</div>
      </v-card>
    </v-col>
  </v-row>

  <!-- 행 액션 다이얼로그 -->
  <v-dialog :model-value="!!actionJob" max-width="420" @update:model-value="(v: boolean) => !v && closeAction()">
    <v-card v-if="actionJob" class="pa-4">
      <v-card-title class="text-h5">{{ actionJob.mold_number }}</v-card-title>
      <v-card-text>
        <div class="text-body-1 mb-4">{{ actionJob.customer_name }} · {{ actionJob.work_order }}</div>

        <template v-if="!showZonePicker">
          <v-btn block size="large" height="64" color="info" class="mb-2" :disabled="acting" @click="goToExtrusion">
            압출작업
          </v-btn>
          <v-btn
            v-if="actionPanel !== '0'"
            block
            size="large"
            height="64"
            color="success"
            class="mb-2"
            :loading="acting"
            @click="doCheckout"
          >
            대출
          </v-btn>
          <v-btn
            v-if="actionPanel !== '0'"
            block
            size="large"
            height="64"
            color="primary"
            class="mb-2"
            :disabled="acting"
            @click="showZonePicker = true"
          >
            ZONE 변경
          </v-btn>
          <v-btn block size="large" height="64" color="error" variant="tonal" :loading="acting" @click="doCancel">
            {{ actionPanel === '0' ? '대출취소' : '예열취소' }}
          </v-btn>
        </template>
        <template v-else>
          <div class="text-body-1 mb-2">이동할 Zone을 선택하세요</div>
          <v-btn
            v-for="z in (['1', '2', '3'] as const)"
            :key="z"
            block
            size="large"
            height="64"
            color="primary"
            class="mb-2"
            :disabled="acting || actionPanel === z"
            @click="doChangeZone(z)"
          >
            {{ z }} Zone
          </v-btn>
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeAction">닫기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 예열등록 마법사 -->
  <v-dialog v-model="showWizard" fullscreen persistent>
    <v-card>
      <v-toolbar color="primary">
        <v-btn v-if="wizardStep > 1" icon="mdi-arrow-left" @click="wizardStep === 3 ? backToStep2() : backToStep1()" />
        <v-toolbar-title>예열등록 ({{ wizardStep }}/3)</v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" @click="closeWizard" />
      </v-toolbar>

      <v-container class="pa-6">
        <template v-if="wizardStep === 1">
          <h2 class="text-h5 mb-4">1. 작업지시 선택</h2>
          <v-card
            v-for="wo in eligibleWorkOrders"
            :key="wo.name"
            class="pa-4 mb-3"
            @click="selectWorkOrder(wo)"
          >
            <div class="d-flex justify-space-between">
              <span class="text-h6 font-weight-bold">{{ wo.name }}</span>
              <span class="text-h6">{{ wo.custom_mold }}</span>
            </div>
            <div class="text-body-1 text-medium-emphasis">
              {{ wo.customer_name }} · 수량 {{ wo.qty }} · 납기 {{ wo.expected_delivery_date }}
            </div>
          </v-card>
          <div v-if="eligibleWorkOrders.length === 0" class="text-center text-medium-emphasis pa-8">
            예열 등록 가능한 작업지시가 없습니다.
          </div>
        </template>

        <template v-else-if="wizardStep === 2">
          <h2 class="text-h5 mb-4">2. 금형 선택 ({{ selectedWorkOrder?.custom_mold }})</h2>
          <v-card
            v-for="mold in availableMolds"
            :key="mold.name"
            class="pa-4 mb-3"
            @click="chooseMold(mold)"
          >
            <span class="text-h6 font-weight-bold">{{ mold.mold_number }}</span>
          </v-card>
          <div v-if="availableMolds.length === 0" class="text-center text-medium-emphasis pa-8">
            사용 가능한(보관중) 금형이 없습니다.
          </div>
        </template>

        <template v-else-if="wizardStep === 3">
          <h2 class="text-h5 mb-6">3. Zone 선택</h2>
          <v-row>
            <v-col v-for="z in (['1', '2', '3'] as const)" :key="z" cols="12" md="4">
              <v-card
                color="primary"
                variant="tonal"
                class="pa-8 text-center"
                min-height="180"
                @click="!registering && confirmRegister(z)"
              >
                <div class="text-h3 font-weight-bold">{{ z }}</div>
                <div class="text-h6">Zone</div>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-container>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
