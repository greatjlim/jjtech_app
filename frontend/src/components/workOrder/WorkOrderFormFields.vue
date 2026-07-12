<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import PickerField from '@/components/PickerField.vue'
import { getMoldModel, searchMoldModels } from '@/api/moldModel'
import { listSalesOrderItems, type SalesOrderItemListItem } from '@/api/salesOrder'
import {
  getSalesOrderOption,
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

const lineOptions = ref<SalesOrderItemListItem[]>([])
const workstationOptions = ref<string[]>([])
const remainingQty = ref<number | null>(null)
const salesOrderLabel = ref('')
const moldLabel = ref('')

onMounted(async () => {
  workstationOptions.value = await listWorkstations()
})

const resolveMold = (id: string) => getMoldModel(id).catch(() => null)

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

// PickerField는 실제로 선택(또는 프로그램적 clear)이 일어났을 때만 select를 emit하므로,
// 수정 화면에서 기존 값을 resolveFn으로 채울 때는 이 핸들러가 실행되지 않는다(=기존에
// 저장된 값을 덮어쓰지 않음).
const onSalesOrderChange = (so: SalesOrderOption) => {
  form.value.sales_order_item = ''
  form.value.production_item = ''
  form.value.custom_mold = ''
  form.value.expected_delivery_date = so.delivery_date ?? ''
}

const onLineChange = () => {
  const line = lineOptions.value.find((l) => l.name === form.value.sales_order_item)
  if (line) {
    form.value.production_item = line.item_code
    form.value.custom_mold = line.custom_mold ?? ''
  }
}

const lineLabel = (line: SalesOrderItemListItem) => `${line.item_name} (주문 ${line.qty})`
const soColumns = [
  { key: 'name', title: '수주번호' },
  { key: 'customer_name', title: '거래처' },
  { key: 'delivery_date', title: '납기' },
]
const moldColumns = [
  { key: 'model_number', title: '형번' },
  { key: 'vendor_model_number', title: '발주처형번' },
  { key: 'purpose', title: '용도' },
]
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="수주" required>
        <PickerField
          v-model="form.sales_order"
          v-model:display-text="salesOrderLabel"
          dialog-title="수주 선택"
          :search-fn="searchOpenSalesOrders"
          :resolve-fn="getSalesOrderOption"
          :columns="soColumns"
          item-value="name"
          item-label="name"
          :disabled="readonly"
          @select="onSalesOrderChange"
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
      <LabelWithElement title="형번" required>
        <PickerField
          v-model="form.custom_mold"
          v-model:display-text="moldLabel"
          dialog-title="형번 선택"
          :search-fn="searchMoldModels"
          :resolve-fn="resolveMold"
          :columns="moldColumns"
          item-value="name"
          item-label="model_number"
          :disabled="readonly"
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
