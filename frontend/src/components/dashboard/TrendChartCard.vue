<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = withDefaults(
  defineProps<{
    title: string
    categories: string[]
    values: number[]
    seriesName: string
    color?: string
  }>(),
  { color: '#2a78d6' },
)

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
const inkSecondary = computed(() => (isDark.value ? '#c3c2b7' : '#52514e'))
const inkMuted = '#898781'
const gridColor = computed(() => (isDark.value ? '#2c2c2a' : '#e1e0d9'))

const series = computed(() => [{ name: props.seriesName, data: props.values }])
const chartOptions = computed(() => ({
  chart: { type: 'line' as const, toolbar: { show: false } },
  xaxis: { categories: props.categories, labels: { style: { colors: inkMuted } } },
  yaxis: { labels: { style: { colors: inkMuted } } },
  grid: { borderColor: gridColor.value },
  colors: [props.color],
  stroke: { width: 2, curve: 'smooth' as const },
  markers: { size: 4, colors: [props.color], strokeColors: isDark.value ? '#1a1a19' : '#fcfcfb', strokeWidth: 2 },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))

const hasData = computed(() => props.values.some((v) => v > 0))
</script>

<template>
  <v-card elevation="2" class="h-100">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ title }}</v-card-title>
    <v-card-text>
      <apexchart v-if="hasData" type="line" height="280" :options="chartOptions" :series="series" />
      <div v-else class="text-center text-medium-emphasis py-10">데이터가 없습니다</div>
      <div class="text-caption mt-1" :style="{ color: inkSecondary }">{{ seriesName }}</div>
    </v-card-text>
  </v-card>
</template>
