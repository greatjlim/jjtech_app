<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  completeExtrusion,
  getExtrusionRecipe,
  getInProgressExtrusionJob,
  listExtrusionQueue,
  startExtrusion,
  type CutPair,
  type ExtrusionJob,
  type ExtrusionQueueItem,
  type ExtrusionRecipe,
} from '@/api/extrusion'
import { ApiError } from '@/api/client'

const route = useRoute()
const router = useRouter()

const workstation = computed(() => String(route.params.workstation))
const mold = computed(() => String(route.params.mold))

const recipe = ref<ExtrusionRecipe | null>(null)
const queue = ref<ExtrusionQueueItem[]>([])
const loading = ref(true)

const today = new Date().toISOString().slice(0, 10)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const notify = (message: string, color: 'success' | 'error' = 'success') => {
  snackbarColor.value = color
  snackbarText.value = message
  snackbar.value = true
}

const refresh = async () => {
  const [r, q] = await Promise.all([getExtrusionRecipe(mold.value), listExtrusionQueue(mold.value)])
  recipe.value = r
  queue.value = q
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
  router.push(`/kiosk/${encodeURIComponent(workstation.value)}/preheat`)
}

const shift = ref<'주간' | '야간'>('주간')

const selectedRow = ref<ExtrusionQueueItem | null>(null)
const currentJob = ref<ExtrusionJob | null>(null)
const busy = ref(false)

const selectRow = async (row: ExtrusionQueueItem) => {
  selectedRow.value = row
  currentJob.value = row.extrusion_status === '진행중' ? await getInProgressExtrusionJob(row.name) : null
  cuts.value = emptyCuts()
}

const inProgress = computed(() => selectedRow.value?.extrusion_status === '진행중' || !!currentJob.value)

const doStart = async () => {
  if (!selectedRow.value) return
  busy.value = true
  try {
    currentJob.value = await startExtrusion(selectedRow.value.name, workstation.value, mold.value, shift.value)
    notify('작업이 시작되었습니다.')
    await refresh()
    const refreshedRow = queue.value.find((r) => r.name === selectedRow.value?.name)
    if (refreshedRow) selectedRow.value = refreshedRow
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '작업시작에 실패했습니다.', 'error')
  } finally {
    busy.value = false
  }
}

const emptyCuts = (): CutPair[] => [
  { length: null, qty: null },
  { length: null, qty: null },
  { length: null, qty: null },
  { length: null, qty: null },
  { length: null, qty: null },
]

const cuts = ref<CutPair[]>(emptyCuts())

const doComplete = async () => {
  if (!currentJob.value) return
  busy.value = true
  try {
    await completeExtrusion(currentJob.value.name, cuts.value)
    notify('작업이 완료되었습니다.')
    currentJob.value = null
    selectedRow.value = null
    cuts.value = emptyCuts()
    await refresh()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '작업완료에 실패했습니다.', 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="d-flex align-center mb-4 flex-wrap ga-4">
    <v-btn icon="mdi-arrow-left" size="x-large" variant="text" @click="goBack" />
    <h1 class="text-h4 font-weight-bold">{{ workstation }} 압출작업</h1>
    <v-spacer />
    <div class="text-body-1">작업일자 {{ today }}</div>
    <v-radio-group v-model="shift" inline hide-details :disabled="inProgress">
      <v-radio color="primary" label="주간" value="주간" />
      <v-radio color="primary" label="야간" value="야간" />
    </v-radio-group>
    <div class="text-h6">
      금형번호 <strong>{{ recipe?.mold_number }}</strong> · 홀수 {{ recipe?.hole_count }} · 단중 {{ recipe?.unit_weight }}
    </div>
  </div>

  <v-row dense>
    <v-col cols="12" md="3">
      <v-card class="pa-3 h-100">
        <div class="text-subtitle-1 font-weight-bold mb-2">작업정보</div>
        <v-row dense>
          <v-col cols="6"><div class="text-caption">절단방법</div><div class="text-body-1">{{ recipe?.cutting_method || '-' }}</div></v-col>
          <v-col cols="6"><div class="text-caption">빌렛트길이</div><div class="text-body-1">{{ recipe?.billet_length }}</div></v-col>
          <v-col cols="6"><div class="text-caption">빌렛트수량</div><div class="text-body-1">{{ recipe?.billet_qty }}</div></v-col>
          <v-col cols="6"><div class="text-caption">압출길이</div><div class="text-body-1">{{ recipe?.extrusion_length }}</div></v-col>
          <v-col cols="6"><div class="text-caption">개당제품수</div><div class="text-body-1">{{ recipe?.pieces_per_billet }}</div></v-col>
          <v-col cols="6">
            <div class="text-caption">작업대상수량</div>
            <div class="text-body-1 font-weight-bold text-error">{{ recipe?.target_qty }}</div>
          </v-col>
        </v-row>
      </v-card>
    </v-col>

    <v-col cols="12" md="6">
      <v-card class="pa-3 h-100">
        <div class="text-subtitle-1 font-weight-bold mb-2">압출 및 빌레트투입 정보</div>
        <template v-if="selectedRow">
          <v-row dense>
            <v-col cols="12" sm="5">
              <div class="mb-1"><span class="text-caption">작지번호</span> <span class="text-body-2">{{ selectedRow.name }}</span></div>
              <div class="mb-1"><span class="text-caption">수주처명</span> <span class="text-body-2">{{ selectedRow.customer_name || '-' }}</span></div>
              <div class="mb-1"><span class="text-caption">규격</span> <span class="text-body-2">{{ selectedRow.spec || '-' }}</span></div>
              <div class="mb-1"><span class="text-caption">재질</span> <span class="text-body-2">{{ selectedRow.material || '-' }}</span></div>
              <div class="mb-1"><span class="text-caption">수량</span> <span class="text-body-2">{{ selectedRow.qty }}</span></div>
              <div class="mb-2"><span class="text-caption">중량</span> <span class="text-body-2">{{ selectedRow.weight || '-' }}</span></div>

              <v-btn
                v-if="!inProgress && selectedRow.extrusion_status !== '완료'"
                block
                size="large"
                height="48"
                color="primary"
                :loading="busy"
                @click="doStart"
              >
                작업시작
              </v-btn>
              <v-btn
                v-else-if="inProgress"
                block
                size="large"
                height="48"
                color="success"
                :loading="busy"
                @click="doComplete"
              >
                작업완료
              </v-btn>
              <div v-else class="text-body-1 text-success font-weight-bold">이미 완료되었습니다.</div>
            </v-col>

            <v-col cols="12" sm="7">
              <div class="text-caption text-medium-emphasis mb-1">절단길이 / 절단수량</div>
              <div v-if="!inProgress" class="text-caption text-medium-emphasis mb-1">작업시작 후 입력 가능</div>
              <div v-for="i in 5" :key="i" class="d-flex ga-1 mb-1">
                <v-text-field
                  v-model.number="cuts[i - 1].length"
                  :label="`길이${i}${i === 1 ? '*' : ''}`"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 45%"
                  :disabled="!inProgress"
                />
                <v-text-field
                  v-model.number="cuts[i - 1].qty"
                  :label="`수량${i}${i === 1 ? '*' : ''}`"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 45%"
                  :disabled="!inProgress"
                />
              </div>
            </v-col>
          </v-row>
        </template>
        <div v-else class="text-medium-emphasis pa-8 text-center">대기열에서 작업지시를 선택하세요</div>
      </v-card>
    </v-col>

    <v-col cols="12" md="3">
      <v-card class="pa-3 h-100">
        <div class="text-subtitle-1 font-weight-bold mb-2">도면</div>
        <v-img v-if="recipe?.drawing_image" :src="recipe.drawing_image" max-height="200" contain />
        <div v-else class="text-medium-emphasis pa-8 text-center">등록된 도면이 없습니다</div>
      </v-card>
    </v-col>
  </v-row>

  <h2 class="text-subtitle-1 font-weight-bold mt-3 mb-1">작업지시 대기열 (같은 형번)</h2>
  <v-row dense>
    <v-col v-for="row in queue" :key="row.name" cols="12" md="6" lg="4">
      <v-card
        class="pa-2"
        :color="selectedRow?.name === row.name ? 'primary' : undefined"
        :variant="selectedRow?.name === row.name ? 'tonal' : 'outlined'"
        @click="selectRow(row)"
      >
        <div class="d-flex justify-space-between align-center">
          <span class="text-body-1 font-weight-bold">{{ row.name }}</span>
          <v-chip
            :color="row.extrusion_status === '완료' ? 'success' : row.extrusion_status === '진행중' ? 'warning' : undefined"
            size="x-small"
          >
            {{ row.extrusion_status || '지시' }}
          </v-chip>
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ row.customer_name || '-' }} · 규격 {{ row.spec || '-' }} · 색상 {{ row.color || '-' }} · 재질
          {{ row.material || '-' }} · 열처리 {{ row.heat_treatment || '-' }} · 수량 {{ row.qty }} · 중량
          {{ row.weight || '-' }}
        </div>
      </v-card>
    </v-col>
  </v-row>
  <div v-if="!loading && queue.length === 0" class="text-center text-medium-emphasis pa-4">대기열이 비어 있습니다.</div>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
