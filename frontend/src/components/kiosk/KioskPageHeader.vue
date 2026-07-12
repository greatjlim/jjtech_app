<script setup lang="ts">
defineProps<{
  title: string
  workstation: string
}>()

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <div class="kiosk-page-header d-flex align-center mb-5 flex-wrap" style="gap: 16px">
    <v-btn icon="mdi-arrow-left" size="x-large" variant="tonal" @click="emit('back')" />
    <div class="workstation-badge">{{ workstation }}</div>
    <h1 class="text-h4 font-weight-bold">{{ title }}</h1>
    <v-spacer />
    <div class="d-flex align-center flex-wrap" style="gap: 16px">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.workstation-badge {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  font-weight: 700;
  font-size: 1.25rem;
  padding: 8px 18px;
  border-radius: 8px;
  line-height: 1;
}
</style>
