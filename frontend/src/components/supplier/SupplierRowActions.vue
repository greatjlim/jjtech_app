<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community'
import type { SupplierListItem } from '@/api/supplier'

const props = defineProps<{
  params: ICellRendererParams<SupplierListItem> & {
    onEdit: (name: string) => void
    onDelete: (name: string) => void
  }
}>()
</script>

<template>
  <div>
    <v-tooltip text="수정">
      <template #activator="{ props: tooltipProps }">
        <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onEdit(props.params.data!.name)">
          <v-icon size="20" color="primary">mdi-pencil</v-icon>
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
  </div>
</template>
