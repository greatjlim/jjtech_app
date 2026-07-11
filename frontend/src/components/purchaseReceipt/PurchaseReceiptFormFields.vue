<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import PurchaseReceiptLineAddDialog from './PurchaseReceiptLineAddDialog.vue'
import { listWarehouses, type WarehouseOption } from '@/api/stock'
import type { PurchaseReceiptFormLine, PurchaseReceiptFormState } from '@/api/purchaseReceipt'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  { readonly: false },
)

const form = defineModel<PurchaseReceiptFormState>({ required: true })

const warehouseOptions = ref<WarehouseOption[]>([])

onMounted(async () => {
  warehouseOptions.value = await listWarehouses()
})

const showAddDialog = ref(false)

const addLine = (line: PurchaseReceiptFormLine, supplier: string, supplierName: string) => {
  if (form.value.items.length > 0 && form.value.supplier && form.value.supplier !== supplier) {
    window.alert('한 입고에는 같은 공급업체의 발주 라인만 담을 수 있습니다.')
    return
  }
  form.value.supplier = supplier
  form.value.supplier_name = supplierName
  form.value.items.push({ ...line, warehouse: line.warehouse || form.value.set_warehouse })
}

const removeLine = (index: number) => {
  form.value.items.splice(index, 1)
}
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="공급업체">
        <v-text-field :model-value="form.supplier_name" readonly placeholder="라인 추가 시 자동 설정됩니다" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="입고일자" required>
        <v-text-field v-model="form.posting_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="창고" required>
        <v-select
          v-model="form.set_warehouse"
          :items="warehouseOptions"
          item-title="name"
          item-value="name"
          :disabled="readonly"
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="비고">
        <v-textarea v-model="form.remarks" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
  </v-row>

  <v-divider class="my-4" />
  <div class="d-flex align-center justify-space-between mb-2">
    <h6 class="text-h6">입고상세</h6>
    <v-btn v-if="!readonly" color="primary" variant="text" prepend-icon="mdi-plus" @click="showAddDialog = true">
      라인 추가
    </v-btn>
  </div>
  <v-table density="comfortable">
    <thead>
      <tr>
        <th>발주번호</th>
        <th>품명</th>
        <th>입고수량</th>
        <th>단가</th>
        <th>창고</th>
        <th v-if="!readonly" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="(line, index) in form.items" :key="index">
        <td>{{ line.purchase_order }}</td>
        <td>{{ line.item_name }}</td>
        <td>{{ line.qty }}</td>
        <td>{{ line.rate.toLocaleString() }}</td>
        <td>{{ line.warehouse }}</td>
        <td v-if="!readonly">
          <v-btn icon size="small" variant="plain" @click="removeLine(index)">
            <v-icon color="error">mdi-delete</v-icon>
          </v-btn>
        </td>
      </tr>
      <tr v-if="form.items.length === 0">
        <td colspan="6" class="text-center text-medium-emphasis">등록된 라인이 없습니다</td>
      </tr>
    </tbody>
  </v-table>

  <PurchaseReceiptLineAddDialog v-model="showAddDialog" :default-warehouse="form.set_warehouse" @add="addLine" />
</template>
