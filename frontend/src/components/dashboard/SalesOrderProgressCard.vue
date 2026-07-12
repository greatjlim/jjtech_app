<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import type { SalesOrderProgressRow } from '@/api/dashboard'

defineProps<{
  rows: SalesOrderProgressRow[]
  loading?: boolean
}>()

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const STAGES: { key: keyof SalesOrderProgressRow; label: string; light: string; dark: string }[] = [
  { key: 'unassigned_qty', label: '미배정', light: '#898781', dark: '#898781' },
  { key: 'extruding_qty', label: '압출중', light: '#2a78d6', dark: '#3987e5' },
  { key: 'cutting_qty', label: '절단중', light: '#1baf7a', dark: '#199e70' },
  { key: 'packaging_qty', label: '포장중', light: '#eda100', dark: '#c98500' },
  { key: 'shipping_qty', label: '출고대기', light: '#4a3aa7', dark: '#9085e9' },
  { key: 'shipped_qty', label: '출고완료', light: '#008300', dark: '#008300' },
]

const stageColor = (stage: (typeof STAGES)[number]) => (isDark.value ? stage.dark : stage.light)

const segments = (row: SalesOrderProgressRow) => {
  const total = row.ordered_qty || 1
  return STAGES.map((stage) => {
    const qty = row[stage.key] as number
    return { key: stage.key, label: stage.label, qty, pct: (qty / total) * 100, color: stageColor(stage) }
  })
}
</script>

<template>
  <v-card elevation="2" :loading="loading">
    <v-card-title class="d-flex align-center flex-wrap" style="gap: 16px">
      <span class="text-subtitle-1 font-weight-bold">수주별 통합 진행현황</span>
      <div class="d-flex align-center flex-wrap text-caption text-medium-emphasis" style="gap: 12px">
        <span v-for="stage in STAGES" :key="stage.key" class="d-flex align-center" style="gap: 4px">
          <span class="legend-dot" :style="{ background: stageColor(stage) }" />{{ stage.label }}
        </span>
      </div>
    </v-card-title>
    <v-card-subtitle class="text-caption">
      압출·절단·포장 단계까지 반영됩니다. 금형예열은 수량 개념이 없어 압출중 구간에 합쳐서 표시됩니다.
    </v-card-subtitle>
    <v-card-text>
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>수주번호</th>
            <th>거래처</th>
            <th>품명</th>
            <th>주문수량</th>
            <th style="min-width: 220px">진행현황</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.sales_order_item">
            <td>{{ row.sales_order }}</td>
            <td>{{ row.customer_name }}</td>
            <td>{{ row.item_name }}</td>
            <td style="font-variant-numeric: tabular-nums">{{ row.ordered_qty }}</td>
            <td>
              <div class="progress-track">
                <div
                  v-for="seg in segments(row)"
                  :key="seg.key"
                  class="progress-segment"
                  :style="{ width: seg.pct + '%', background: seg.color }"
                  :title="`${seg.label}: ${seg.qty}`"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis">표시할 수주가 없습니다</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}
.progress-track {
  display: flex;
  gap: 2px;
  height: 12px;
  width: 100%;
}
.progress-segment {
  height: 100%;
  border-radius: 4px;
  min-width: 0;
}
</style>
