<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community'
import type { SalesOrderListItem } from '@/api/salesOrder'

const props = defineProps<{
  params: ICellRendererParams<SalesOrderListItem> & {
    onEdit: (name: string) => void
  }
}>()
</script>

<template>
  <div>
    <v-tooltip text="조회/수정">
      <template #activator="{ props: tooltipProps }">
        <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onEdit(props.params.data!.name)">
          <v-icon size="20" color="primary">mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </div>
</template>
