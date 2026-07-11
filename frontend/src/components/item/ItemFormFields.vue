<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import ItemClassificationPickerDialog from './ItemClassificationPickerDialog.vue'
import { listUoms, type ItemFormState } from '@/api/item'
import { getItemGroupAncestors, itemGroupPathLabel } from '@/api/itemGroup'

withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
    readonly?: boolean
  }>(),
  { mode: 'edit', readonly: false },
)

const form = defineModel<ItemFormState>({ required: true })

const uomOptions = ref<string[]>([])
const classificationLabel = ref('')
const showPicker = ref(false)

onMounted(async () => {
  uomOptions.value = await listUoms()
  if (form.value.item_group) {
    const path = await getItemGroupAncestors(form.value.item_group)
    classificationLabel.value = itemGroupPathLabel(path)
  }
})

const onClassificationSelect = (value: string, label: string) => {
  form.value.item_group = value
  classificationLabel.value = label
}
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="품목번호" required>
        <v-text-field v-model="form.item_code" :disabled="mode === 'edit' || readonly" maxlength="20" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="품목명" required>
        <v-text-field v-model="form.item_name" :disabled="readonly" maxlength="100" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="분류">
        <div class="d-flex align-center ga-2">
          <v-text-field :model-value="classificationLabel" readonly placeholder="분류를 선택하세요" density="comfortable" />
          <v-btn variant="outlined" :disabled="readonly" @click="showPicker = true">선택</v-btn>
        </div>
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="매입가">
        <v-text-field v-model.number="form.custom_purchase_price" type="number" :disabled="readonly" suffix="원" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="판매가">
        <v-text-field v-model.number="form.standard_rate" type="number" :disabled="readonly" suffix="원" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="부가세">
        <v-text-field v-model.number="form.custom_vat" type="number" :disabled="readonly" suffix="원" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="재고단위">
        <v-autocomplete v-model="form.stock_uom" :items="uomOptions" :disabled="readonly" variant="outlined" density="comfortable" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="등록일자">
        <v-text-field v-model="form.custom_register_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="비고">
        <v-textarea v-model="form.description" :disabled="readonly" maxlength="200" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="사용여부" required>
        <v-radio-group v-model="form.useOrNot" inline hide-details :disabled="readonly">
          <v-radio color="primary" label="사용" value="Y" />
          <v-radio color="primary" label="미사용" value="N" />
        </v-radio-group>
      </LabelWithElement>
    </v-col>
  </v-row>

  <ItemClassificationPickerDialog v-model="showPicker" :initial-value="form.item_group" @select="onClassificationSelect" />
</template>
