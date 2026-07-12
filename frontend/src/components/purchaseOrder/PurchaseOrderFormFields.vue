<script setup lang="ts">
import { ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import PickerField from '@/components/PickerField.vue'
import PurchaseOrderLineDialog from './PurchaseOrderLineDialog.vue'
import { getSupplier, listSuppliers } from '@/api/supplier'
import type { PurchaseOrderFormLine, PurchaseOrderFormState } from '@/api/purchaseOrder'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  { readonly: false },
)

const form = defineModel<PurchaseOrderFormState>({ required: true })
const supplierLabel = ref('')

const searchSuppliers = (search: string) => listSuppliers(search, 0, 50).then((r) => r.items)
const resolveSupplier = (id: string) => getSupplier(id).catch(() => null)
const supplierColumns = [
  { key: 'supplier_name', title: '공급업체명' },
  { key: 'custom_representative_name', title: '대표자' },
  { key: 'custom_phone_number', title: '전화번호' },
]

const showLineDialog = ref(false)

const addLine = (line: PurchaseOrderFormLine) => {
  form.value.items.push(line)
}

const removeLine = (index: number) => {
  form.value.items.splice(index, 1)
}
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="공급업체" required>
        <PickerField
          v-model="form.supplier"
          v-model:display-text="supplierLabel"
          dialog-title="공급업체 선택"
          :search-fn="searchSuppliers"
          :resolve-fn="resolveSupplier"
          :columns="supplierColumns"
          item-value="name"
          item-label="supplier_name"
          :disabled="readonly"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="발주일자" required>
        <v-text-field v-model="form.transaction_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="납기예정일" required>
        <v-text-field v-model="form.schedule_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="비고">
        <v-textarea v-model="form.custom_remark" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
  </v-row>

  <v-divider class="my-4" />
  <div class="d-flex align-center justify-space-between mb-2">
    <h6 class="text-h6">발주 품목</h6>
    <v-btn v-if="!readonly" color="primary" variant="text" prepend-icon="mdi-plus" @click="showLineDialog = true">
      품목 추가
    </v-btn>
  </div>
  <v-table density="comfortable">
    <thead>
      <tr>
        <th>품명</th>
        <th>수량</th>
        <th>단가</th>
        <th>금액</th>
        <th>납기예정일</th>
        <th v-if="!readonly" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="(line, index) in form.items" :key="index">
        <td>{{ line.item_name }}</td>
        <td>{{ line.qty }}</td>
        <td>{{ line.rate.toLocaleString() }}</td>
        <td>{{ (line.qty * line.rate).toLocaleString() }}</td>
        <td>{{ line.schedule_date }}</td>
        <td v-if="!readonly">
          <v-btn icon size="small" variant="plain" @click="removeLine(index)">
            <v-icon color="error">mdi-delete</v-icon>
          </v-btn>
        </td>
      </tr>
      <tr v-if="form.items.length === 0">
        <td colspan="6" class="text-center text-medium-emphasis">등록된 품목이 없습니다</td>
      </tr>
    </tbody>
  </v-table>

  <PurchaseOrderLineDialog v-model="showLineDialog" @add="addLine" />
</template>
