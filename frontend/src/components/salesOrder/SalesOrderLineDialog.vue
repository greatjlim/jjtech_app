<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import PickerField from '@/components/PickerField.vue'
import { searchItems, type ItemListItem } from '@/api/item'
import { searchMoldModels } from '@/api/moldModel'
import type { SalesOrderFormLine } from '@/api/salesOrder'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ add: [line: SalesOrderFormLine] }>()

const itemCode = ref('')
const itemName = ref('')
const moldName = ref('')
const moldLabel = ref('')
const orderSpec = ref('')
const qty = ref(1)
const orderWeight = ref(0)
const rate = ref(0)
const color = ref('')
const material = ref('')
const heatTreatment = ref('')

const amount = computed(() => (qty.value || 0) * (rate.value || 0))

const init = () => {
  itemCode.value = ''
  itemName.value = ''
  moldName.value = ''
  moldLabel.value = ''
  orderSpec.value = ''
  qty.value = 1
  orderWeight.value = 0
  rate.value = 0
  color.value = ''
  material.value = ''
  heatTreatment.value = ''
}

watch(show, (newShow) => {
  if (newShow) init()
})

const onItemSelect = (item: ItemListItem) => {
  itemName.value = item.item_name
  if (item.standard_rate) {
    rate.value = item.standard_rate
  }
}

const itemColumns = [
  { key: 'item_name', title: '품명' },
  { key: 'standard_rate', title: '표준단가' },
]
const moldColumns = [
  { key: 'model_number', title: '형번' },
  { key: 'vendor_model_number', title: '발주처형번' },
  { key: 'purpose', title: '용도' },
]

const save = () => {
  emit('add', {
    item_code: itemCode.value,
    item_name: itemName.value,
    qty: qty.value,
    rate: rate.value,
    custom_mold: moldName.value,
    custom_order_spec: orderSpec.value,
    custom_order_weight: orderWeight.value,
    custom_color: color.value,
    custom_material: material.value,
    custom_heat_treatment: heatTreatment.value,
  })
  show.value = false
}
</script>

<template>
  <FormDialog v-model="show" title="수주관리 물품 추가" @save="save">
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
            @select="onItemSelect"
          />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="6">
        <LabelWithElement title="형번">
          <PickerField
            v-model="moldName"
            v-model:display-text="moldLabel"
            dialog-title="형번 선택"
            :search-fn="searchMoldModels"
            :columns="moldColumns"
            item-value="name"
            item-label="model_number"
            clearable
          />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="주문규격">
          <v-text-field v-model="orderSpec" maxlength="10" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="주문수량" required>
          <v-text-field v-model.number="qty" type="number" suffix="개" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="수주중량">
          <v-text-field v-model.number="orderWeight" type="number" suffix="kg" />
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
      <v-col cols="12" md="4">
        <LabelWithElement title="색상">
          <v-text-field v-model="color" placeholder="추후통보 가능" maxlength="20" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="재질">
          <v-text-field v-model="material" placeholder="예: 6063" maxlength="20" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="열처리방법">
          <v-text-field v-model="heatTreatment" placeholder="예: A6063S-T5" maxlength="20" />
        </LabelWithElement>
      </v-col>
    </v-row>
  </FormDialog>
</template>
