<script setup lang="ts">
import type { SalesOrderProgressRow } from '@/api/dashboard'

defineProps<{
  rows: SalesOrderProgressRow[]
  loading?: boolean
}>()

const COLOR_UNASSIGNED = '#898781'
const COLOR_IN_PRODUCTION = '#2a78d6'
const COLOR_SHIPPED = '#0ca30c'

const segments = (row: SalesOrderProgressRow) => {
  const total = row.ordered_qty || 1
  return [
    { key: 'unassigned', qty: row.unassigned_qty, pct: (row.unassigned_qty / total) * 100, color: COLOR_UNASSIGNED },
    {
      key: 'in_production',
      qty: row.in_production_qty,
      pct: (row.in_production_qty / total) * 100,
      color: COLOR_IN_PRODUCTION,
    },
    { key: 'shipped', qty: row.shipped_qty, pct: (row.shipped_qty / total) * 100, color: COLOR_SHIPPED },
  ]
}
</script>

<template>
  <v-card elevation="2" :loading="loading">
    <v-card-title class="d-flex align-center flex-wrap" style="gap: 16px">
      <span class="text-subtitle-1 font-weight-bold">수주별 통합 진행현황</span>
      <div class="d-flex align-center text-caption text-medium-emphasis" style="gap: 12px">
        <span class="d-flex align-center" style="gap: 4px">
          <span class="legend-dot" :style="{ background: COLOR_UNASSIGNED }" />미배정
        </span>
        <span class="d-flex align-center" style="gap: 4px">
          <span class="legend-dot" :style="{ background: COLOR_IN_PRODUCTION }" />생산중
        </span>
        <span class="d-flex align-center" style="gap: 4px">
          <span class="legend-dot" :style="{ background: COLOR_SHIPPED }" />출고완료
        </span>
      </div>
    </v-card-title>
    <v-card-subtitle class="text-caption">
      압출·절단·포장 단계별 세분화는 아직 수주라인과 직접 연결돼 있지 않아 이번 버전에는 포함하지
      않았습니다(추후 스키마 보강 예정). 지금은 작업지시 배정 여부와 출고 여부만으로 계산됩니다.
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
                  :title="`${seg.key}: ${seg.qty}`"
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
