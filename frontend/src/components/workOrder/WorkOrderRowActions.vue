<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community'
import type { WorkOrderListItem } from '@/api/workOrder'

const props = defineProps<{
  params: ICellRendererParams<WorkOrderListItem> & {
    onEdit: (name: string) => void
    onSubmit: (name: string) => void
    onCancel: (name: string) => void
    onDelete: (name: string) => void
  }
}>()
</script>

<template>
  <div v-if="props.params.data">
    <v-tooltip text="조회/수정">
      <template #activator="{ props: tooltipProps }">
        <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onEdit(props.params.data!.name)">
          <v-icon size="20" color="primary">mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <template v-if="props.params.data!.docstatus === 0">
      <v-tooltip text="생산지시 내리기">
        <template #activator="{ props: tooltipProps }">
          <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onSubmit(props.params.data!.name)">
            <v-icon size="20" color="success">mdi-check-circle</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip text="삭제">
        <template #activator="{ props: tooltipProps }">
          <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onDelete(props.params.data!.name)">
            <v-icon size="20" color="error">mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </template>
    <v-tooltip v-else-if="props.params.data!.docstatus === 1" text="제출취소">
      <template #activator="{ props: tooltipProps }">
        <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onCancel(props.params.data!.name)">
          <v-icon size="20" color="warning">mdi-undo</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </div>
</template>
