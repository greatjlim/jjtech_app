<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LabelWithElement from '@/components/LabelWithElement.vue'
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
}

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

const showCompleteDialog = ref(false)
const cuts = ref<CutPair[]>([
  { length: null, qty: null },
  { length: null, qty: null },
  { length: null, qty: null },
  { length: null, qty: null },
  { length: null, qty: null },
])
const extraCutRows = ref(1)

const openComplete = () => {
  cuts.value = [
    { length: null, qty: null },
    { length: null, qty: null },
    { length: null, qty: null },
    { length: null, qty: null },
    { length: null, qty: null },
  ]
  extraCutRows.value = 1
  showCompleteDialog.value = true
}

const doComplete = async () => {
  if (!currentJob.value) return
  busy.value = true
  try {
    await completeExtrusion(currentJob.value.name, cuts.value)
    notify('작업이 완료되었습니다.')
    showCompleteDialog.value = false
    currentJob.value = null
    selectedRow.value = null
    await refresh()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : '작업완료에 실패했습니다.', 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="d-flex align-center mb-4">
    <v-btn icon="mdi-arrow-left" size="x-large" variant="text" @click="goBack" />
    <h1 class="text-h4 font-weight-bold ml-2">압출작업 · {{ mold }}</h1>
  </div>

  <v-card v-if="recipe" variant="tonal" color="primary" class="pa-4 mb-4">
    <div class="text-h6 mb-2">{{ recipe.mold_model }} 표준설정</div>
    <v-row dense>
      <v-col cols="6" md="2"><div class="text-caption">절단방법</div><div class="text-h6">{{ recipe.cutting_method || '-' }}</div></v-col>
      <v-col cols="6" md="2"><div class="text-caption">빌렛트길이</div><div class="text-h6">{{ recipe.billet_length }}</div></v-col>
      <v-col cols="6" md="2"><div class="text-caption">빌렛트수량</div><div class="text-h6">{{ recipe.billet_qty }}</div></v-col>
      <v-col cols="6" md="2"><div class="text-caption">압출길이</div><div class="text-h6">{{ recipe.extrusion_length }}</div></v-col>
      <v-col cols="6" md="2"><div class="text-caption">개당제품수</div><div class="text-h6">{{ recipe.pieces_per_billet }}</div></v-col>
      <v-col cols="6" md="2"><div class="text-caption">작업대상수량</div><div class="text-h6 font-weight-bold text-error">{{ recipe.target_qty }}</div></v-col>
    </v-row>
  </v-card>

  <v-row>
    <v-col cols="12" md="7">
      <h2 class="text-h6 mb-2">작업지시 대기열</h2>
      <v-card
        v-for="row in queue"
        :key="row.name"
        class="pa-4 mb-2"
        :color="selectedRow?.name === row.name ? 'primary' : undefined"
        :variant="selectedRow?.name === row.name ? 'tonal' : 'outlined'"
        @click="selectRow(row)"
      >
        <div class="d-flex justify-space-between">
          <span class="text-h6 font-weight-bold">{{ row.name }}</span>
          <v-chip
            :color="row.extrusion_status === '완료' ? 'success' : row.extrusion_status === '진행중' ? 'warning' : undefined"
            size="small"
          >
            {{ row.extrusion_status || '지시' }}
          </v-chip>
        </div>
        <div class="text-body-2 text-medium-emphasis">{{ row.customer_name }} · 수량 {{ row.qty }}</div>
      </v-card>
      <div v-if="!loading && queue.length === 0" class="text-center text-medium-emphasis pa-8">대기열이 비어 있습니다.</div>
    </v-col>

    <v-col cols="12" md="5">
      <h2 class="text-h6 mb-2">작업</h2>
      <v-card v-if="!selectedRow" class="pa-8 text-center text-medium-emphasis">작업지시를 선택하세요</v-card>
      <v-card v-else class="pa-6">
        <div class="text-h6 mb-4">{{ selectedRow.name }}</div>

        <template v-if="selectedRow.extrusion_status === '완료'">
          <div class="text-h6 text-success">이미 완료되었습니다.</div>
        </template>

        <template v-else-if="selectedRow.extrusion_status === '진행중' || currentJob">
          <div class="text-body-1 mb-4">진행 중입니다.</div>
          <v-btn block size="large" height="64" color="success" :loading="busy" @click="openComplete">작업완료</v-btn>
        </template>

        <template v-else>
          <LabelWithElement title="주야간구분">
            <v-radio-group v-model="shift" inline hide-details>
              <v-radio color="primary" label="주간" value="주간" />
              <v-radio color="primary" label="야간" value="야간" />
            </v-radio-group>
          </LabelWithElement>
          <v-btn block size="large" height="64" color="primary" class="mt-4" :loading="busy" @click="doStart">작업시작</v-btn>
        </template>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="showCompleteDialog" max-width="520" persistent>
    <v-card class="pa-4">
      <v-card-title class="text-h5">절단길이/절단수량</v-card-title>
      <v-card-text>
        <v-row v-for="i in extraCutRows" :key="i" dense>
          <v-col cols="6">
            <v-text-field
              v-model.number="cuts[i - 1].length"
              :label="`절단길이${i}${i === 1 ? ' *' : ''}`"
              type="number"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="cuts[i - 1].qty"
              :label="`절단수량${i}${i === 1 ? ' *' : ''}`"
              type="number"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
        <v-btn v-if="extraCutRows < 5" variant="text" color="primary" @click="extraCutRows++">+ 추가</v-btn>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn size="large" height="56" variant="text" @click="showCompleteDialog = false">취소</v-btn>
        <v-btn size="large" height="56" color="success" :loading="busy" @click="doComplete">확인</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
