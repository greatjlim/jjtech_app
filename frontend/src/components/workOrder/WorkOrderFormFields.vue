<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import { searchItems, type ItemListItem } from '@/api/item'
import { searchMolds, type MoldListItem } from '@/api/mold'
import { listWorkstations, type WorkOrderFormState } from '@/api/workOrder'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  { readonly: false },
)

const form = defineModel<WorkOrderFormState>({ required: true })

const itemOptions = ref<ItemListItem[]>([])
const moldOptions = ref<MoldListItem[]>([])
const workstationOptions = ref<string[]>([])

onMounted(async () => {
  ;[itemOptions.value, moldOptions.value, workstationOptions.value] = await Promise.all([
    searchItems(''),
    searchMolds(''),
    listWorkstations(),
  ])
})
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="품목" required>
        <v-autocomplete
          v-model="form.production_item"
          :items="itemOptions"
          item-title="item_name"
          item-value="name"
          :disabled="readonly"
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="수량" required>
        <v-text-field v-model.number="form.qty" type="number" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="호기" required>
        <v-select
          v-model="form.custom_workstation"
          :items="workstationOptions"
          :disabled="readonly"
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="금형">
        <v-autocomplete
          v-model="form.custom_mold"
          :items="moldOptions"
          item-title="mold_number"
          item-value="name"
          clearable
          :disabled="readonly"
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="작업예정일" required>
        <v-text-field v-model="form.planned_start_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="납기">
        <v-text-field v-model="form.expected_delivery_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
  </v-row>
</template>
