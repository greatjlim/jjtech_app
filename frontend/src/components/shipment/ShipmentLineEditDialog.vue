<script setup lang="ts">
import { reactive, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import type { ShipmentFormLine } from '@/api/shipment'

const props = defineProps<{
  line: ShipmentFormLine | null
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ save: [line: ShipmentFormLine] }>()

const form = reactive<ShipmentFormLine>({
  item_code: '',
  item_name: '',
  customer: '',
  customer_name: '',
  mold_model: '',
  spec: '',
  color: '',
  material: '',
  heat_treatment: '',
  sales_order: '',
  sales_order_item: '',
  packaging: '',
  order_qty: 0,
  ship_qty: 0,
  ship_weight: 0,
})

watch(
  () => props.line,
  (line) => {
    if (line) Object.assign(form, line)
  },
  { immediate: true },
)

const save = () => {
  emit('save', { ...form })
  show.value = false
}
</script>

<template>
  <FormDialog v-model="show" title="출고상세 라인 수정" @save="save">
    <v-row>
      <v-col cols="12" md="6">
        <LabelWithElement title="품명">
          <v-text-field :model-value="form.item_name" readonly />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="6">
        <LabelWithElement title="거래처">
          <v-text-field :model-value="form.customer_name" readonly />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="형번">
          <v-text-field v-model="form.mold_model" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="규격">
          <v-text-field v-model="form.spec" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="색상">
          <v-text-field v-model="form.color" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="재질">
          <v-text-field v-model="form.material" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="열처리방법">
          <v-text-field v-model="form.heat_treatment" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4" v-if="form.sales_order">
        <LabelWithElement title="주문수량">
          <v-text-field :model-value="form.order_qty" readonly />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="출고수량" required>
          <v-text-field v-model.number="form.ship_qty" type="number" />
        </LabelWithElement>
      </v-col>
      <v-col cols="12" md="4">
        <LabelWithElement title="출고중량">
          <v-text-field v-model.number="form.ship_weight" type="number" suffix="kg" />
        </LabelWithElement>
      </v-col>
    </v-row>
  </FormDialog>
</template>
