<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getCuttingInfo,
  listCuttingQueue,
  registerCutting,
  startCutting,
  type CuttingInfo,
  type CuttingQueueItem,
  type PalletInput,
} from '@/api/cutting'
import { ApiError } from '@/api/client'
import KioskPageHeader from '@/components/kiosk/KioskPageHeader.vue'

const route = useRoute()
const router = useRouter()

const workstation = computed(() => String(route.params.workstation))
const today = new Date().toISOString().slice(0, 10)
const shift = ref<'주간' | '야간'>('주간')

const queue = ref<CuttingQueueItem[]>([])
const loading = ref(true)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const notify = (message: string, color: 'success' | 'error' = 'success') => {
  snackbarColor.value = color
  snackbarText.value = message
  snackbar.value = true
}

const refresh = async () => {
  queue.value = await listCuttingQueue(workstation.value)
}

onMounted(async () => {
  loading.value = true
  try {
    await refresh()
  } finally {
    loading.value = false
  }
})

const goBack = () => {
  router.push('/kiosk')
}

const emptyPallet = (): PalletInput => ({ pallet_no: '', cut_length: null, cut_qty: null, sample_length: null, sample_weight: null })

const selectedRow = ref<CuttingQueueItem | null>(null)
const started = ref(false)
const readyToRegister = ref(false)
const pallets = ref<PalletInput[]>([])
const busy = ref(false)

const drawingDialog = ref(false)
const drawingInfo = ref<CuttingInfo | null>(null)

const selectRow = (row: CuttingQueueItem) => {
  selectedRow.value = row
  started.value = row.cutting_status === '진행중'
  readyToRegister.value = false
  pallets.value = started.value ? [emptyPallet()] : []
}

const doStart = async () => {
  if (!selectedRow.value) return
  busy.value = true
  try {
    await startCutting(selectedRow.value.work_order, workstation.value)
    started.value = true
    pallets.value = [emptyPallet()]
    notify('절단작업이 시작되었습니다.')
    await refresh()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '절단시작에 실패했습니다.', 'error')
  } finally {
    busy.value = false
  }
}

const addPallet = () => {
  pallets.value.push(emptyPallet())
}

const removePallet = () => {
  if (pallets.value.length > 1) pallets.value.pop()
}

const markComplete = () => {
  readyToRegister.value = true
}

const doRegister = async () => {
  if (!selectedRow.value) return
  busy.value = true
  try {
    const result = await registerCutting(selectedRow.value.work_order, workstation.value, pallets.value)
    notify(`절단등록 완료 (${result.cutting_lots.length}건, 총 ${result.total_qty}본)`)
    selectedRow.value = null
    started.value = false
    readyToRegister.value = false
    pallets.value = []
    await refresh()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '절단등록에 실패했습니다.', 'error')
  } finally {
    busy.value = false
  }
}

const openDrawing = async () => {
  if (!selectedRow.value) return
  drawingInfo.value = await getCuttingInfo(selectedRow.value.work_order)
  drawingDialog.value = true
}
</script>

<template>
  <KioskPageHeader title="절단작업" :workstation="workstation" @back="goBack">
    <div class="text-body-1">생산일자 {{ today }}</div>
    <v-radio-group v-model="shift" inline hide-details :disabled="started">
      <v-radio color="primary" label="주간" value="주간" />
      <v-radio color="primary" label="야간" value="야간" />
    </v-radio-group>
    <v-btn variant="outlined" size="large" height="64" :disabled="!selectedRow" @click="openDrawing">도면보기</v-btn>
  </KioskPageHeader>

  <v-row dense>
    <v-col cols="12" md="5">
      <h2 class="text-subtitle-1 font-weight-bold mb-1">절단 대기열</h2>
      <v-card
        v-for="row in queue"
        :key="row.work_order"
        class="pa-2 mb-1"
        :color="selectedRow?.work_order === row.work_order ? 'primary' : undefined"
        :variant="selectedRow?.work_order === row.work_order ? 'tonal' : 'outlined'"
        @click="selectRow(row)"
      >
        <div class="d-flex justify-space-between align-center">
          <span class="text-body-1 font-weight-bold">{{ row.work_order }}</span>
          <v-chip v-if="row.cutting_status" color="warning" size="small" variant="flat" class="font-weight-bold">
            {{ row.cutting_status }}
          </v-chip>
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ row.mold_model }} · {{ row.customer_name || '-' }} · 규격 {{ row.spec || '-' }} · 색상
          {{ row.color || '-' }} · 재질 {{ row.material || '-' }} · 열처리 {{ row.heat_treatment || '-' }} · 수량
          {{ row.qty }} · 중량 {{ row.weight || '-' }}
        </div>
      </v-card>
      <div v-if="!loading && queue.length === 0" class="text-center text-medium-emphasis pa-4">
        절단 대기 중인 작업지시가 없습니다.
      </div>
    </v-col>

    <v-col cols="12" md="7">
      <v-card v-if="!selectedRow" class="pa-8 text-center text-medium-emphasis">대기열에서 작업지시를 선택하세요</v-card>
      <v-card v-else class="pa-3">
        <div class="d-flex justify-space-between align-center mb-2">
          <div class="text-subtitle-1 font-weight-bold">{{ selectedRow.work_order }}</div>
          <v-btn
            v-if="!started"
            color="primary"
            size="large"
            height="64"
            :loading="busy"
            @click="doStart"
          >
            절단시작
          </v-btn>
        </div>

        <v-row dense class="mb-2">
          <v-col cols="4"><div class="text-caption">규격(생산지시)</div><div class="text-body-2">{{ selectedRow.spec || '-' }}</div></v-col>
          <v-col cols="4"><div class="text-caption">수량(생산지시)</div><div class="text-body-2">{{ selectedRow.qty }}</div></v-col>
          <v-col cols="4"><div class="text-caption">중량(생산지시)</div><div class="text-body-2">{{ selectedRow.weight || '-' }}</div></v-col>
        </v-row>

        <template v-if="started">
          <v-divider class="mb-2" />
          <div class="d-flex justify-space-between align-center mb-1">
            <div class="text-body-2">파렛트 (실절단)</div>
            <div>
              <v-btn size="small" variant="text" color="primary" :disabled="readyToRegister" @click="addPallet">+ 파렛트추가</v-btn>
              <v-btn size="small" variant="text" color="error" :disabled="readyToRegister || pallets.length <= 1" @click="removePallet">
                파렛트삭제
              </v-btn>
            </div>
          </div>

          <div v-for="(pallet, idx) in pallets" :key="idx" class="d-flex ga-1 mb-1 flex-wrap">
            <v-text-field
              v-model="pallet.pallet_no"
              label="파렛트번호"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 20%"
              :disabled="readyToRegister"
            />
            <v-text-field
              v-model.number="pallet.cut_length"
              :label="`절단길이${idx === 0 ? ' *' : ''}`"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 20%"
              :disabled="readyToRegister"
            />
            <v-text-field
              v-model.number="pallet.cut_qty"
              :label="`절단수량${idx === 0 ? ' *' : ''}`"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 20%"
              :disabled="readyToRegister"
            />
            <v-text-field
              v-model.number="pallet.sample_length"
              label="SAMPLE길이"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 18%"
              :disabled="readyToRegister"
            />
            <v-text-field
              v-model.number="pallet.sample_weight"
              label="SAMPLE중량"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 18%"
              :disabled="readyToRegister"
            />
          </div>

          <v-btn
            v-if="!readyToRegister"
            block
            size="large"
            height="64"
            color="success"
            class="mt-2"
            @click="markComplete"
          >
            절단완료
          </v-btn>
          <v-btn
            v-else
            block
            size="large"
            height="64"
            color="primary"
            class="mt-2"
            :loading="busy"
            @click="doRegister"
          >
            절단등록
          </v-btn>
        </template>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="drawingDialog" max-width="600">
    <v-card class="pa-4">
      <div class="text-h6 mb-2">도면 · {{ drawingInfo?.mold_model }}</div>
      <v-img v-if="drawingInfo?.drawing_image" :src="drawingInfo.drawing_image" max-height="400" contain />
      <div v-else class="text-medium-emphasis pa-8 text-center">등록된 도면이 없습니다</div>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="drawingDialog = false">닫기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
