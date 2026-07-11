<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  deletePackaging,
  listPackagingHistory,
  listPackagingQueue,
  registerPackaging,
  type PackagingHistoryItem,
  type PackagingQueueItem,
} from '@/api/packaging'
import { ApiError } from '@/api/client'

const route = useRoute()
const router = useRouter()

const workstation = computed(() => String(route.params.workstation))
const today = new Date().toISOString().slice(0, 10)

const tab = ref<'대기' | '완료'>('대기')
const shift = ref<'주간' | '야간'>('주간')
const jobTime = ref('10분')
const JOB_TIME_OPTIONS = ['10분', '20분', '30분', '40분', '50분', '60분', '60분이상']

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const notify = (message: string, color: 'success' | 'error' = 'success') => {
  snackbarColor.value = color
  snackbarText.value = message
  snackbar.value = true
}

const goBack = () => {
  router.push('/kiosk')
}

// 포장대기
const queue = ref<PackagingQueueItem[]>([])
const loadingQueue = ref(true)
const selectedLot = ref<PackagingQueueItem | null>(null)
const packQty = ref<number | null>(null)
const badQty = ref<number | null>(null)
const badCode = ref('')
const busy = ref(false)

const refreshQueue = async () => {
  queue.value = await listPackagingQueue(workstation.value)
}

const selectLot = (lot: PackagingQueueItem) => {
  selectedLot.value = lot
  packQty.value = null
  badQty.value = null
  badCode.value = ''
}

watch(packQty, (val) => {
  if (!selectedLot.value || val == null) return
  const leftover = selectedLot.value.remaining - val
  badQty.value = leftover > 0 ? leftover : 0
})

const doRegister = async () => {
  if (!selectedLot.value || packQty.value == null) return
  busy.value = true
  try {
    await registerPackaging({
      cuttingLot: selectedLot.value.cutting_lot,
      workOrder: selectedLot.value.work_order,
      workstation: workstation.value,
      packQty: packQty.value,
      shift: shift.value,
      badQty: badQty.value ?? 0,
      badCode: badCode.value,
      jobTime: jobTime.value,
    })
    notify('포장이 등록되었습니다.')
    selectedLot.value = null
    packQty.value = null
    badQty.value = null
    badCode.value = ''
    await refreshQueue()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '포장등록에 실패했습니다.', 'error')
  } finally {
    busy.value = false
  }
}

// 포장완료
const historyDate = ref(today)
const history = ref<PackagingHistoryItem[]>([])
const loadingHistory = ref(false)

const refreshHistory = async () => {
  loadingHistory.value = true
  try {
    history.value = await listPackagingHistory(workstation.value, historyDate.value)
  } finally {
    loadingHistory.value = false
  }
}

const doDelete = async (item: PackagingHistoryItem) => {
  if (!window.confirm(`${item.pallet_no ?? item.cutting_lot} 포장기록을 삭제하시겠습니까?`)) return
  try {
    await deletePackaging(item.name)
    notify('삭제되었습니다.')
    await Promise.all([refreshHistory(), refreshQueue()])
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '삭제에 실패했습니다.', 'error')
  }
}

watch(historyDate, refreshHistory)
watch(tab, (val) => {
  if (val === '완료') refreshHistory()
})

onMounted(async () => {
  loadingQueue.value = true
  try {
    await refreshQueue()
  } finally {
    loadingQueue.value = false
  }
})
</script>

<template>
  <div class="d-flex align-center mb-3 flex-wrap ga-4">
    <v-btn icon="mdi-arrow-left" size="x-large" variant="text" @click="goBack" />
    <h1 class="text-h4 font-weight-bold">{{ workstation }} 포장등록</h1>
    <v-spacer />
    <div class="text-body-1">포장일자 {{ today }}</div>
    <v-radio-group v-model="shift" inline hide-details>
      <v-radio color="primary" label="주간" value="주간" />
      <v-radio color="primary" label="야간" value="야간" />
    </v-radio-group>
    <v-select
      v-model="jobTime"
      :items="JOB_TIME_OPTIONS"
      label="작업시간"
      variant="outlined"
      density="compact"
      hide-details
      style="max-width: 140px"
    />
  </div>

  <v-tabs v-model="tab" class="mb-2">
    <v-tab value="대기">포장대기</v-tab>
    <v-tab value="완료">포장완료</v-tab>
  </v-tabs>

  <div v-if="tab === '대기'">
    <v-row dense>
      <v-col cols="12" md="5">
        <h2 class="text-subtitle-1 font-weight-bold mb-1">포장 대기열</h2>
        <v-card
          v-for="row in queue"
          :key="row.cutting_lot"
          class="pa-2 mb-1"
          :color="selectedLot?.cutting_lot === row.cutting_lot ? 'primary' : undefined"
          :variant="selectedLot?.cutting_lot === row.cutting_lot ? 'tonal' : 'outlined'"
          @click="selectLot(row)"
        >
          <div class="d-flex justify-space-between align-center">
            <span class="text-body-1 font-weight-bold">{{ row.pallet_no || row.cutting_lot }}</span>
            <span class="text-caption">잔량 {{ row.remaining }}</span>
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ row.work_order }} · {{ row.mold_model }} · {{ row.customer_name || '-' }} · 규격
            {{ row.spec || '-' }} · 색상 {{ row.color || '-' }} · 절단수량 {{ row.cut_qty }} · 기포장
            {{ row.packed_so_far }}
          </div>
        </v-card>
        <div v-if="!loadingQueue && queue.length === 0" class="text-center text-medium-emphasis pa-4">
          포장 대기 중인 파렛트가 없습니다.
        </div>
      </v-col>

      <v-col cols="12" md="7">
        <v-card v-if="!selectedLot" class="pa-8 text-center text-medium-emphasis">대기열에서 파렛트를 선택하세요</v-card>
        <v-card v-else class="pa-3">
          <div class="text-subtitle-1 font-weight-bold mb-2">{{ selectedLot.pallet_no || selectedLot.cutting_lot }}</div>
          <v-row dense class="mb-2">
            <v-col cols="4"><div class="text-caption">절단수량</div><div class="text-body-2">{{ selectedLot.cut_qty }}</div></v-col>
            <v-col cols="4"><div class="text-caption">기포장</div><div class="text-body-2">{{ selectedLot.packed_so_far }}</div></v-col>
            <v-col cols="4"><div class="text-caption">잔량</div><div class="text-body-2 font-weight-bold">{{ selectedLot.remaining }}</div></v-col>
          </v-row>

          <v-divider class="mb-2" />

          <div class="d-flex ga-2 flex-wrap">
            <v-text-field
              v-model.number="packQty"
              label="포장수량 *"
              type="number"
              variant="outlined"
              density="compact"
              style="max-width: 30%"
            />
            <v-text-field
              v-model.number="badQty"
              label="불량수량"
              type="number"
              variant="outlined"
              density="compact"
              style="max-width: 30%"
            />
            <v-text-field
              v-model="badCode"
              :label="`불량명${badQty ? ' *' : ''}`"
              variant="outlined"
              density="compact"
              style="max-width: 35%"
            />
          </div>

          <v-btn block size="large" height="56" color="primary" class="mt-2" :loading="busy" :disabled="!packQty" @click="doRegister">
            생산포장
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </div>

  <div v-else>
    <v-text-field
      v-model="historyDate"
      type="date"
      label="포장일자"
      variant="outlined"
      density="compact"
      style="max-width: 220px"
      class="mb-2"
    />
    <v-card v-for="item in history" :key="item.name" class="pa-2 mb-1" variant="outlined">
      <div class="d-flex justify-space-between align-center">
        <span class="text-body-1 font-weight-bold">{{ item.pallet_no || item.cutting_lot }}</span>
        <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="doDelete(item)" />
      </div>
      <div class="text-caption text-medium-emphasis">
        {{ item.work_order }} · {{ item.mold_model }} · 포장 {{ item.pack_qty }} · 불량
        {{ item.bad_qty }}{{ item.bad_code ? ` (${item.bad_code})` : '' }}
      </div>
    </v-card>
    <div v-if="!loadingHistory && history.length === 0" class="text-center text-medium-emphasis pa-4">
      해당 날짜의 포장 이력이 없습니다.
    </div>
  </div>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
