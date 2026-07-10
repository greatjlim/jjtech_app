<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    required?: boolean
  }>(),
  { required: false },
)
</script>

<template>
  <div>
    <v-label class="font-weight-medium mb-2">
      {{ title }}<span v-if="required" class="text-error ms-1">*</span>
    </v-label>
    <div>
      <slot />
    </div>
  </div>
</template>
