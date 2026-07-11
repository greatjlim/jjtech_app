<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import { searchMoldModels, type MoldModelListItem } from '@/api/moldModel'
import { listSalesOrderItems, type SalesOrderItemListItem } from '@/api/salesOrder'
import {
  getWorkOrderedQty,
  listWorkstations,
  searchOpenSalesOrders,
  type SalesOrderOption,
  type WorkOrderFormState,
} from '@/api/workOrder'

const props = withDefaults(
  defineProps<{
    readonly?: boolean
    currentName?: string
  }>(),
  { readonly: false, currentName: '' },
)

const form = defineModel<WorkOrderFormState>({ required: true })

const salesOrderOptions = ref<SalesOrderOption[]>([])
const lineOptions = ref<SalesOrderItemListItem[]>([])
const moldOptions = ref<MoldModelListItem[]>([])
const workstationOptions = ref<string[]>([])
const remainingQty = ref<number | null>(null)

onMounted(async () => {
  ;[salesOrderOptions.value, moldOptions.value, workstationOptions.value] = await Promise.all([
    searchOpenSalesOrders(''),
    searchMoldModels(''),
    listWorkstations(),
  ])
})

// 수주가 바뀌면(등록 화면에서 사용자가 고르거나, 수정 화면에서 기존 값을 불러오거나) 그 수주의
// 라인 목록을 다시 조회한다.
watch(
  () => form.value.sales_order,
  async (so) => {
    if (!so) {
      lineOptions.value = []
      return
    }
    const { items } = await listSalesOrderItems(so, 0, 100)
    lineOptions.value = items
  },
  { immediate: true },
)

// 잔여수량 표시는 정보성이라 수주/라인/라인목록 중 무엇이 바뀌든 다시 계산한다.
watch(
  () => [form.value.sales_order, form.value.sales_order_item, lineOptions.value] as const,
  async ([so, lineName, lines]) => {
    if (!so || !lineName) {
      remainingQty.value = null
      return
    }
    const line = lines.find((l) => l.name === lineName)
    if (!line) {
      remainingQty.value = null
      return
    }
    const ordered = await getWorkOrderedQty(so, line.item_code, props.currentName || undefined)
    remainingQty.value = line.qty - ordered
  },
  { immediate: true },
)

// v-autocomplete/v-select는 사용자가 실제로 선택했을 때만 update:model-value를 emit하므로,
// 수정 화면에서 기존 값을 프로그램적으로 채울 때는 이 핸들러가 실행되지 않는다(=기존에
// 저장된 값을 덮어쓰지 않음).
const onSalesOrderChange = () => {
  form.value.sales_order_item = ''
  form.value.production_item = ''
  form.value.custom_mold = ''
  const picked = salesOrderOptions.value.find((so) => so.name === form.value.sales_order)
  form.value.expected_delivery_date = picked?.delivery_date ?? ''
}

const onLineChange = () => {
  const line = lineOptions.value.find((l) => l.name === form.value.sales_order_item)
  if (line) {
    form.value.production_item = line.item_code
    form.value.custom_mold = line.custom_mold ?? ''
  }
}

const soLabel = (so: SalesOrderOption) => `${so.name} (${so.customer_name})`
const lineLabel = (line: SalesOrderItemListItem) => `${line.item_name} (주문 ${line.qty})`
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="수주" required>
        <v-autocomplete
          v-model="form.sales_order"
          :items="salesOrderOptions"
          :item-title="soLabel"
          item-value="name"
          :disabled="readonly"
          variant="outlined"
          density="comfortable"
          @update:model-value="onSalesOrderChange"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="수주 라인(품목)" required>
        <v-select
          v-model="form.sales_order_item"
          :items="lineOptions"
          :item-title="lineLabel"
          item-value="name"
          :disabled="readonly || !form.sales_order"
          variant="outlined"
          density="comfortable"
          @update:model-value="onLineChange"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="수량" required>
        <v-text-field
          v-model.number="form.qty"
          type="number"
          :disabled="readonly"
          :hint="remainingQty !== null ? `잔여 ${remainingQty}개` : undefined"
          persistent-hint
        />
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
      <LabelWithElement title="형번">
        <v-autocomplete
          v-model="form.custom_mold"
          :items="moldOptions"
          item-title="model_number"
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
