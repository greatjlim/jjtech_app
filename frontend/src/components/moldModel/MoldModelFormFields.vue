<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import { getMoldModelFieldOptions, type MoldModelDoc } from '@/api/moldModel'
import { listCustomers } from '@/api/customer'
import { uploadFile } from '@/api/client'

withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
  }>(),
  { mode: 'edit' },
)

const form = defineModel<Partial<MoldModelDoc>>({ required: true })

const businessTypeOptions = ref<string[]>([])
const orderTypeOptions = ref<string[]>([])
const purposeOptions = ref<string[]>([])
const textureHeatTreatmentOptions = ref<string[]>([])
const surfaceTreatmentMethodOptions = ref<string[]>([])
const insulationDivisionOptions = ref<string[]>([])
const partnerTypeOptions = ref<string[]>([])

const customerOptions = ref<{ name: string; customer_name: string }[]>([])

const uploading = ref(false)
const selectedDrawingFile = ref<File[]>([])
watch(selectedDrawingFile, async (files) => {
  const file = files?.[0]
  if (!file) return
  uploading.value = true
  try {
    form.value.drawing_image = await uploadFile(file)
  } finally {
    uploading.value = false
  }
})

onMounted(async () => {
  ;[
    businessTypeOptions.value,
    orderTypeOptions.value,
    purposeOptions.value,
    textureHeatTreatmentOptions.value,
    surfaceTreatmentMethodOptions.value,
    insulationDivisionOptions.value,
    partnerTypeOptions.value,
  ] = await Promise.all([
    getMoldModelFieldOptions('business_type'),
    getMoldModelFieldOptions('order_type'),
    getMoldModelFieldOptions('purpose'),
    getMoldModelFieldOptions('texture_heat_treatment'),
    getMoldModelFieldOptions('surface_treatment_method'),
    getMoldModelFieldOptions('insulation_division'),
    getMoldModelFieldOptions('partner_type'),
  ])
  const { items } = await listCustomers('', 0, 100)
  customerOptions.value = items
})
</script>

<template>
  <v-row>
    <v-col cols="12">
      <h6 class="text-h6">기본정보</h6>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="형번" required>
        <v-text-field v-model="form.model_number" :disabled="mode === 'edit'" maxlength="8" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="영업구분">
        <v-select v-model="form.business_type" :items="businessTypeOptions" variant="outlined" density="comfortable" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="유형구분">
        <v-select v-model="form.order_type" :items="orderTypeOptions" variant="outlined" density="comfortable" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="수주처" required>
        <v-autocomplete
          v-model="form.vendor"
          :items="customerOptions"
          item-title="customer_name"
          item-value="name"
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="수주처형번">
        <v-text-field v-model="form.vendor_model_number" maxlength="20" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="현장명">
        <v-text-field v-model="form.site_name" maxlength="40" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="용도">
        <v-select v-model="form.purpose" :items="purposeOptions" variant="outlined" density="comfortable" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="TYPE" required>
        <v-radio-group v-model="form.mold_type" inline hide-details>
          <v-radio color="primary" label="SOLID" value="SOLID" />
          <v-radio color="primary" label="HOLLOW" value="HOLLOW" />
          <v-radio color="primary" label="Semi Hollow" value="Semi Hollow" />
        </v-radio-group>
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="재질/열처리">
        <v-select
          v-model="form.texture_heat_treatment"
          :items="textureHeatTreatmentOptions"
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="표면처리방법">
        <v-select
          v-model="form.surface_treatment_method"
          :items="surfaceTreatmentMethodOptions"
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="질소가스 투입">
        <v-radio-group v-model="form.nitrogen_gas" inline hide-details>
          <v-radio color="primary" label="아니오" :value="0" />
          <v-radio color="primary" label="예" :value="1" />
        </v-radio-group>
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="도면이미지">
        <v-file-input v-model="selectedDrawingFile" :loading="uploading" show-size density="comfortable" variant="outlined" />
        <v-img v-if="form.drawing_image" :src="form.drawing_image" max-height="120" class="mt-2" />
      </LabelWithElement>
    </v-col>
  </v-row>

  <v-divider class="my-6" />
  <v-row>
    <v-col cols="12">
      <h6 class="text-h6">치수</h6>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="단중" required>
        <v-text-field v-model.number="form.unit_weight" type="number" suffix="kg/M" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="두께">
        <v-text-field v-model.number="form.thickness" type="number" suffix="mm" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="폭">
        <v-text-field v-model.number="form.width" type="number" suffix="mm" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="높이">
        <v-text-field v-model.number="form.height" type="number" suffix="mm" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="단면적">
        <v-text-field v-model.number="form.area" type="number" suffix="mm²" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="형재외접원">
        <v-text-field v-model.number="form.circumscriber" type="number" suffix="mm" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="외부 표면적">
        <v-text-field v-model.number="form.external_surface_area" type="number" suffix="mm" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="내부 표면적">
        <v-text-field v-model.number="form.internal_surface_area" type="number" suffix="mm" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="금형보유수량">
        <v-text-field v-model.number="form.stock" type="number" />
      </LabelWithElement>
    </v-col>
  </v-row>

  <v-divider class="my-6" />
  <v-row>
    <v-col cols="12">
      <h6 class="text-h6">단열</h6>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="단열구분">
        <v-select v-model="form.insulation_division" :items="insulationDivisionOptions" variant="outlined" density="comfortable" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="단열타입">
        <v-text-field v-model="form.insulation_type_name" :disabled="form.insulation_division !== 'A'" maxlength="10" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="단열면적">
        <v-text-field v-model.number="form.insulation_area" type="number" suffix="mm" :disabled="form.insulation_division !== 'A'" />
      </LabelWithElement>
    </v-col>
  </v-row>

  <v-divider class="my-6" />
  <v-row>
    <v-col cols="12">
      <h6 class="text-h6">파트너</h6>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="파트너구분" required>
        <v-radio-group v-model="form.partner_type" inline hide-details>
          <v-radio v-for="opt in partnerTypeOptions" :key="opt" color="primary" :label="opt" :value="opt" />
        </v-radio-group>
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="파트너업체">
        <v-autocomplete
          v-model="form.partner_company"
          :items="customerOptions"
          item-title="customer_name"
          item-value="name"
          :disabled="form.partner_type === 'No'"
          clearable
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="파트너처 형번">
        <v-text-field v-model="form.partner_model_number" :disabled="form.partner_type === 'No'" maxlength="20" />
      </LabelWithElement>
    </v-col>
  </v-row>

  <v-divider class="my-6" />
  <v-row>
    <v-col cols="12">
      <h6 class="text-h6">기타</h6>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="품질주의사항">
        <div class="d-flex flex-row">
          <v-checkbox v-model="form.quality_precaution_flag" :true-value="1" :false-value="0" class="d-inline" hide-details />
          <v-text-field
            v-model="form.quality_precaution"
            :disabled="form.quality_precaution_flag !== 1"
            class="d-inline"
            maxlength="100"
          />
        </div>
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="생성일자">
        <v-text-field v-model="form.creation_date" type="date" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="변경일자">
        <v-text-field v-model="form.modification_date" type="date" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="폐기일자">
        <v-text-field v-model="form.disposal_date" type="date" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="변경내용">
        <v-text-field v-model="form.modification_content" maxlength="50" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="폐기사유">
        <v-text-field v-model="form.disposal_reason" maxlength="50" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="사용여부" required>
        <v-radio-group v-model="form.use_or_not" inline hide-details>
          <v-radio color="primary" label="사용" :value="1" />
          <v-radio color="primary" label="미사용" :value="0" />
        </v-radio-group>
      </LabelWithElement>
    </v-col>
  </v-row>
</template>
