<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import { searchItems, type ItemListItem } from '@/api/item'
import { searchMoldModels, type MoldModelListItem } from '@/api/moldModel'
import type { SalesOrderFormLine } from '@/api/salesOrder'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ add: [line: SalesOrderFormLine] }>()

const itemOptions = ref<ItemListItem[]>([])
const moldOptions = ref<MoldModelListItem[]>([])

const itemCode = ref('')
const itemName = ref('')
const moldName = ref('')
const orderSpec = ref('')
const qty = ref(1)
const orderWeight = ref(0)
const rate = ref(0)

const amount = computed(() => (qty.value || 0) * (rate.value || 0))

const init = async () => {
  itemCode.value = ''
  itemName.value = ''
  moldName.value = ''
  orderSpec.value = ''
  qty.value = 1
  orderWeight.value = 0
  rate.value = 0
  ;[itemOptions.value, moldOptions.value] = await Promise.all([searchItems(''), searchMoldModels('')])
}

watch(show, (newShow) => {
  if (newShow) init()
})

watch(itemCode, (newItemCode) => {
  const found = itemOptions.value.find((i) => i.name === newItemCode)
  itemName.value = found?.item_name ?? ''
  if (found?.standard_rate) {
    rate.value = found.standard_rate
  }
})

const save = () => {
  emit('add', {
    item_code: itemCode.value,
    item_name: itemName.value,
    qty: qty.value,
    rate: rate.value,
    custom_mold: moldName.value,
    custom_order_spec: orderSpec.value,
    custom_order_weight: orderWeight.value,
  })
  show.value = false
}
</script>

<template>
  <FormDialog v-model="show" title="수주관리 물품 추가" @save="save">
    <v-row>
      <v-col cols="12" md="6">
        <LabelWithElement title="품명" required>
          <v-autocomplete
            v-model="itemCode"
            :items="itemOptions"
            item-title="item_name"
            item-value="name"
            variant="outlined"
            density="comfortable"
          />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="6">
        <LabelWithElement title="형번">
          <v-autocomplete
            v-model="moldName"
            :items="moldOptions"
            item-title="model_number"
            item-value="name"
            clearable
            variant="outlined"
            density="comfortable"
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
    </v-row>
  </FormDialog>
</template>
