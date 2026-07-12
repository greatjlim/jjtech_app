<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import { authStore } from '@/stores/auth'
import StatTile from '@/components/dashboard/StatTile.vue'
import StatusDonutCard from '@/components/dashboard/StatusDonutCard.vue'
import TrendChartCard from '@/components/dashboard/TrendChartCard.vue'
import SalesOrderProgressCard from '@/components/dashboard/SalesOrderProgressCard.vue'
import { getKpiSummary, getSalesOrderProgress, getSalesTrend, type KpiSummary, type SalesOrderProgressRow } from '@/api/dashboard'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const loading = ref(true)
const kpi = ref<KpiSummary | null>(null)
const trendMonths = ref<string[]>([])
const trendCounts = ref<number[]>([])
const progressRows = ref<SalesOrderProgressRow[]>([])
const progressLoading = ref(true)

const WORK_ORDER_STATUS_META: Record<string, { label: string; light: string; dark: string }> = {
  'Not Started': { label: '착수전', light: '#2a78d6', dark: '#3987e5' },
  'In Process': { label: '진행중', light: '#1baf7a', dark: '#199e70' },
  Completed: { label: '완료', light: '#008300', dark: '#008300' },
  Stopped: { label: '중지', light: '#e34948', dark: '#e66767' },
}

const workOrderDonutItems = computed(() => {
  if (!kpi.value) return []
  return kpi.value.work_order.map((row) => {
    const meta = WORK_ORDER_STATUS_META[row.status] ?? { label: row.status, light: '#898781', dark: '#898781' }
    return { label: meta.label, value: row.count, color: isDark.value ? meta.dark : meta.light }
  })
})

const totalOpenWorkOrders = computed(
  () => kpi.value?.work_order.reduce((sum, r) => (r.status === 'Completed' ? sum : sum + r.count), 0) ?? 0,
)

onMounted(async () => {
  loading.value = true
  try {
    const [kpiRes, trendRes] = await Promise.all([getKpiSummary(), getSalesTrend(6)])
    kpi.value = kpiRes
    trendMonths.value = trendRes.map((p) => p.month)
    trendCounts.value = trendRes.map((p) => p.count)
  } finally {
    loading.value = false
  }

  progressLoading.value = true
  try {
    progressRows.value = await getSalesOrderProgress()
  } finally {
    progressLoading.value = false
  }
})
</script>

<template>
  <div class="d-flex align-center justify-space-between mb-4 flex-wrap" style="gap: 8px">
    <div>
      <h1 class="text-h5 font-weight-bold">환영합니다, {{ authStore.fullName }}님</h1>
      <div class="text-body-2 text-medium-emphasis">JJTech 업무 현황을 한눈에 확인하세요.</div>
    </div>
  </div>

  <v-row>
    <v-col cols="12" sm="6" lg="3">
      <StatTile
        label="이번달 신규 수주"
        :value="kpi ? `${kpi.sales_order.this_month_count}건` : '-'"
        icon="mdi-clipboard-text"
        color="primary"
        :hint="kpi ? `임시저장 ${kpi.sales_order.draft}건` : undefined"
      />
    </v-col>
    <v-col cols="12" sm="6" lg="3">
      <StatTile
        label="진행중 작업지시"
        :value="`${totalOpenWorkOrders}건`"
        icon="mdi-factory"
        color="info"
      />
    </v-col>
    <v-col cols="12" sm="6" lg="3">
      <StatTile
        label="이번달 출고"
        :value="kpi ? `${kpi.shipment.this_month_count}건` : '-'"
        icon="mdi-truck-delivery"
        color="success"
        :hint="kpi ? `${kpi.shipment.this_month_weight.toLocaleString()} kg` : undefined"
      />
    </v-col>
    <v-col cols="12" sm="6" lg="3">
      <StatTile
        label="미입고 발주"
        :value="kpi ? `${kpi.purchase_order.pending_receipt_count}건` : '-'"
        icon="mdi-cart-arrow-down"
        color="warning"
      />
    </v-col>
  </v-row>

  <v-row class="mt-1">
    <v-col cols="12" lg="4">
      <StatusDonutCard title="작업지시 상태 분포" :items="workOrderDonutItems" />
    </v-col>
    <v-col cols="12" lg="8">
      <TrendChartCard
        title="최근 6개월 수주 추이"
        :categories="trendMonths"
        :values="trendCounts"
        series-name="수주 건수"
      />
    </v-col>
  </v-row>

  <v-row class="mt-1">
    <v-col cols="12">
      <SalesOrderProgressCard :rows="progressRows" :loading="progressLoading" />
    </v-col>
  </v-row>
</template>
