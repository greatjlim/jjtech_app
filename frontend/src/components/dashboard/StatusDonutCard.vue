<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps<{
  title: string
  items: { label: string; value: number; color: string }[]
}>()

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
const inkPrimary = computed(() => (isDark.value ? '#ffffff' : '#0b0b0b'))
const inkSecondary = computed(() => (isDark.value ? '#c3c2b7' : '#52514e'))

const total = computed(() => props.items.reduce((sum, i) => sum + i.value, 0))

const series = computed(() => props.items.map((i) => i.value))
const chartOptions = computed(() => ({
  chart: { type: 'donut' as const },
  labels: props.items.map((i) => i.label),
  colors: props.items.map((i) => i.color),
  legend: { position: 'bottom' as const, labels: { colors: inkSecondary.value } },
  dataLabels: { enabled: true, style: { colors: ['#ffffff'] } },
  stroke: { width: 2, colors: [isDark.value ? '#1a1a19' : '#fcfcfb'] },
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          total: { show: true, label: '합계', color: inkSecondary.value, formatter: () => String(total.value) },
          value: { color: inkPrimary.value },
        },
      },
    },
  },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))
</script>

<template>
  <v-card elevation="2" class="h-100">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ title }}</v-card-title>
    <v-card-text>
      <apexchart v-if="total > 0" type="donut" height="280" :options="chartOptions" :series="series" />
      <div v-else class="text-center text-medium-emphasis py-10">데이터가 없습니다</div>
    </v-card-text>
  </v-card>
</template>
