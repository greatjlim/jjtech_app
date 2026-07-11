<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import { listUoms, type ItemFormState } from '@/api/item'
import { ITEM_GROUP_ROOT, getItemGroupAncestors, listItemGroupChildren, type ItemGroupNode } from '@/api/itemGroup'

withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
    readonly?: boolean
  }>(),
  { mode: 'edit', readonly: false },
)

const form = defineModel<ItemFormState>({ required: true })

const uomOptions = ref<string[]>([])

const majorOptions = ref<ItemGroupNode[]>([])
const middleOptions = ref<ItemGroupNode[]>([])
const minorOptions = ref<ItemGroupNode[]>([])

const selectedMajor = ref<string>('')
const selectedMiddle = ref<string>('')
const selectedMinor = ref<string>('')

onMounted(async () => {
  uomOptions.value = await listUoms()
  majorOptions.value = await listItemGroupChildren(ITEM_GROUP_ROOT)

  if (form.value.item_group) {
    const path = await getItemGroupAncestors(form.value.item_group)
    if (path[0]) {
      selectedMajor.value = path[0].name
      middleOptions.value = await listItemGroupChildren(path[0].name)
    }
    if (path[1]) {
      selectedMiddle.value = path[1].name
      minorOptions.value = await listItemGroupChildren(path[1].name)
    }
    if (path[2]) {
      selectedMinor.value = path[2].name
    }
  }
})

const onMajorChange = async (value: string | null) => {
  selectedMiddle.value = ''
  selectedMinor.value = ''
  middleOptions.value = []
  minorOptions.value = []
  form.value.item_group = value || ''
  if (value) {
    middleOptions.value = await listItemGroupChildren(value)
  }
}

const onMiddleChange = async (value: string | null) => {
  selectedMinor.value = ''
  minorOptions.value = []
  form.value.item_group = value || selectedMajor.value
  if (value) {
    minorOptions.value = await listItemGroupChildren(value)
  }
}

const onMinorChange = (value: string | null) => {
  form.value.item_group = value || selectedMiddle.value || selectedMajor.value
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
    <v-col cols="12" md="4">
      <LabelWithElement title="대분류">
        <v-select
          v-model="selectedMajor"
          :items="majorOptions"
          item-title="item_group_name"
          item-value="name"
          clearable
          :disabled="readonly"
          variant="outlined"
          density="comfortable"
          @update:model-value="onMajorChange"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="중분류">
        <v-select
          v-model="selectedMiddle"
          :items="middleOptions"
          item-title="item_group_name"
          item-value="name"
          clearable
          :disabled="readonly || !selectedMajor"
          variant="outlined"
          density="comfortable"
          @update:model-value="onMiddleChange"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="소분류">
        <v-select
          v-model="selectedMinor"
          :items="minorOptions"
          item-title="item_group_name"
          item-value="name"
          clearable
          :disabled="readonly || !selectedMiddle"
          variant="outlined"
          density="comfortable"
          @update:model-value="onMinorChange"
        />
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
</template>
