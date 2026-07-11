<script setup lang="ts">
import { ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import { listReceivablePoItems, type PurchaseReceiptFormLine, type ReceivablePoItem } from '@/api/purchaseReceipt'

const props = defineProps<{
  defaultWarehouse: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ add: [line: PurchaseReceiptFormLine, supplier: string, supplierName: string] }>()

const search = ref('')
const results = ref<ReceivablePoItem[]>([])
const loading = ref(false)

const runSearch = async () => {
  loading.value = true
  try {
    results.value = await listReceivablePoItems(search.value || undefined)
  } finally {
    loading.value = false
  }
}

watch(show, (newShow) => {
  if (newShow) {
    search.value = ''
    runSearch()
  }
})

const addRow = (row: ReceivablePoItem) => {
  emit(
    'add',
    {
      item_code: row.item_code,
      item_name: row.item_name,
      qty: row.remaining_qty,
      rate: row.rate,
      warehouse: props.defaultWarehouse,
      purchase_order: row.purchase_order,
      purchase_order_item: row.purchase_order_item,
    },
    row.supplier,
    row.supplier_name,
  )
  show.value = false
}
</script>

<template>
  <FormDialog v-model="show" title="입고상세 라인 추가 (발주 가져오기)" hide-save>
    <div class="d-flex align-center mb-2" style="gap: 8px">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="공급업체/발주번호/품명 검색..."
        hide-details
        density="comfortable"
        @keyup.enter="runSearch"
      />
      <v-btn color="primary" variant="tonal" :loading="loading" @click="runSearch">검색</v-btn>
    </div>
    <v-table density="comfortable" height="400" fixed-header>
      <thead>
        <tr>
          <th>발주번호</th>
          <th>공급업체</th>
          <th>품명</th>
          <th>단가</th>
          <th>발주수량</th>
          <th>미입고수량</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in results" :key="row.purchase_order_item">
          <td>{{ row.purchase_order }}</td>
          <td>{{ row.supplier_name }}</td>
          <td>{{ row.item_name }}</td>
          <td>{{ row.rate.toLocaleString() }}</td>
          <td>{{ row.order_qty }}</td>
          <td>{{ row.remaining_qty }}</td>
          <td>
            <v-btn size="small" color="primary" variant="text" @click="addRow(row)">추가</v-btn>
          </td>
        </tr>
        <tr v-if="results.length === 0">
          <td colspan="7" class="text-center text-medium-emphasis">입고 가능한 발주 라인이 없습니다</td>
        </tr>
      </tbody>
    </v-table>
  </FormDialog>
</template>
