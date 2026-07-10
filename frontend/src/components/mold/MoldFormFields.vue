<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import { getMoldFieldOptions, type MoldCreatePayload } from '@/api/mold'

withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
  }>(),
  { mode: 'edit' },
)

const form = defineModel<MoldCreatePayload>({ required: true })

const currentStatusOptions = ref<string[]>([])
const productionReasonOptions = ref<string[]>([])

onMounted(async () => {
  ;[currentStatusOptions.value, productionReasonOptions.value] = await Promise.all([
    getMoldFieldOptions('current_status'),
    getMoldFieldOptions('production_reason'),
  ])
})
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="형번" required>
        <v-text-field v-model="form.mold_model" disabled />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="금형번호" required>
        <v-text-field v-model="form.mold_number" :disabled="mode === 'edit'" maxlength="20" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="제작업체">
        <v-text-field v-model="form.manufacturer" maxlength="100" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="B구경">
        <v-text-field v-model.number="form.b_diameter" type="number" />
      </LabelWithElement>
    </v-col>
    <v-col cols="6" md="3">
      <LabelWithElement title="압출비">
        <v-text-field v-model.number="form.extrusion_rate" type="number" />
      </LabelWithElement>
    </v-col>
    <v-col cols="6" md="3">
      <LabelWithElement title="Hole수">
        <v-text-field v-model.number="form.hole_count" type="number" />
      </LabelWithElement>
    </v-col>
    <v-col cols="6" md="3">
      <LabelWithElement title="다이">
        <v-text-field v-model.number="form.diameter" type="number" />
      </LabelWithElement>
    </v-col>
    <v-col cols="6" md="3">
      <LabelWithElement title="칫수">
        <v-text-field v-model.number="form.dimension" type="number" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="현재상태">
        <v-select v-model="form.current_status" :items="currentStatusOptions" variant="outlined" density="comfortable" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="제작사유">
        <v-select v-model="form.production_reason" :items="productionReasonOptions" variant="outlined" density="comfortable" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="제작처입고일">
        <v-text-field v-model="form.production_receipt_date" type="date" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="폐기일">
        <v-text-field v-model="form.disposal_date" type="date" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="폐기사유">
        <v-text-field v-model="form.disposal_reason" maxlength="50" />
      </LabelWithElement>
    </v-col>
  </v-row>
</template>
