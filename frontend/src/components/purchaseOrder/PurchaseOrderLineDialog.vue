<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import PickerField from '@/components/PickerField.vue'
import { searchItems } from '@/api/item'
import type { PurchaseOrderFormLine } from '@/api/purchaseOrder'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ add: [line: PurchaseOrderFormLine] }>()

const itemCode = ref('')
const itemName = ref('')
const qty = ref(1)
const rate = ref(0)
const scheduleDate = ref('')

const amount = computed(() => (qty.value || 0) * (rate.value || 0))

const init = () => {
  itemCode.value = ''
  itemName.value = ''
  qty.value = 1
  rate.value = 0
  scheduleDate.value = ''
}

watch(show, (newShow) => {
  if (newShow) init()
})

const itemColumns = [
  { key: 'item_name', title: '품명' },
  { key: 'standard_rate', title: '표준단가' },
]

const save = () => {
  emit('add', {
    item_code: itemCode.value,
    item_name: itemName.value,
    qty: qty.value,
    rate: rate.value,
    schedule_date: scheduleDate.value,
  })
  show.value = false
}
</script>

<template>
  <FormDialog v-model="show" title="발주관리 품목 추가" @save="save">
    <v-row>
      <v-col cols="12" md="6">
        <LabelWithElement title="품명" required>
          <PickerField
            v-model="itemCode"
            v-model:display-text="itemName"
            dialog-title="품명 선택"
            :search-fn="searchItems"
            :columns="itemColumns"
            item-value="name"
            item-label="item_name"
          />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="6">
        <LabelWithElement title="납기예정일">
          <v-text-field v-model="scheduleDate" type="date" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="수량" required>
          <v-text-field v-model.number="qty" type="number" suffix="개" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="단가" required>
          <v-text-field v-model.number="rate" type="number" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="금액">
          <v-text-field :model-value="amount.toLocaleString()" readonly />
        </LabelWithElement>
      </v-col>
    </v-row>
  </FormDialog>
</template>
