<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community'
import type { MoldModelListItem } from '@/api/moldModel'

const props = defineProps<{
  params: ICellRendererParams<MoldModelListItem> & {
    onEdit: (modelNumber: string) => void
    onDelete: (modelNumber: string) => void
  }
}>()
</script>

<template>
  <div>
    <v-tooltip text="수정">
      <template #activator="{ props: tooltipProps }">
        <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onEdit(props.params.data!.model_number)">
          <v-icon size="20" color="primary">mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-tooltip text="삭제">
      <template #activator="{ props: tooltipProps }">
        <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onDelete(props.params.data!.model_number)">
          <v-icon size="20" color="error">mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </div>
</template>
