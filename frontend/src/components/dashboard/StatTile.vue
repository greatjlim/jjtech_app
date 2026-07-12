<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon: string
    color?: string
    hint?: string
  }>(),
  { color: 'primary', hint: undefined },
)
</script>

<template>
  <v-card elevation="2" class="h-100">
    <v-card-text class="d-flex align-center" style="gap: 16px">
      <v-avatar :color="color" variant="tonal" size="48">
        <v-icon :icon="icon" size="26" />
      </v-avatar>
      <div>
        <div class="text-body-2 text-medium-emphasis">{{ label }}</div>
        <div class="text-h5 font-weight-bold" style="font-variant-numeric: tabular-nums">{{ value }}</div>
        <div v-if="hint" class="text-caption text-medium-emphasis">{{ hint }}</div>
      </div>
    </v-card-text>
  </v-card>
</template>
