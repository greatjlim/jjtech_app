<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    loading?: boolean
    hideSave?: boolean
  }>(),
  { title: undefined, loading: false, hideSave: false },
)

const emit = defineEmits<{ save: [] }>()
const show = defineModel<boolean>({ default: false })
</script>

<template>
  <v-dialog v-model="show" persistent min-width="80vw">
    <v-card :loading="loading">
      <v-card-title v-if="title" class="pa-5">
        <span class="text-h5">{{ title }}</span>
      </v-card-title>
      <v-divider />
      <v-container class="overflow-y-auto">
        <v-card-item class="overflow-auto">
          <slot />
        </v-card-item>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn color="error" variant="text" :disabled="loading" @click="show = false">닫기</v-btn>
          <v-btn v-if="!hideSave" color="success" variant="text" :disabled="loading" @click="emit('save')">
            저장
          </v-btn>
        </v-card-actions>
      </v-container>
    </v-card>
  </v-dialog>
</template>
