<script setup lang="ts">
import LabelWithElement from '@/components/LabelWithElement.vue'
import type { CustomerFormState } from '@/api/customer'

withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
  }>(),
  { mode: 'edit' },
)

const form = defineModel<CustomerFormState>({ required: true })
</script>

<template>
  <v-row>
    <v-col cols="12">
      <h6 class="text-h6">기본정보</h6>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="거래처명" required>
        <v-text-field v-model="form.customer_name" :disabled="mode === 'edit'" maxlength="100" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="거래처명(줄임상호)" required>
        <v-text-field v-model="form.custom_company_shorten_name" maxlength="100" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="사업자번호">
        <v-text-field v-model="form.tax_id" maxlength="10" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="전화번호">
        <v-text-field v-model="form.custom_phone_number" maxlength="15" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="휴대폰번호">
        <v-text-field v-model="form.custom_mobile_phone_number" maxlength="15" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="이메일">
        <v-text-field v-model="form.custom_email" maxlength="50" />
      </LabelWithElement>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="사업장 주소">
        <v-text-field v-model="form.custom_address_main" maxlength="100" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="상세주소">
        <v-text-field v-model="form.custom_address_detail" maxlength="30" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="우편번호">
        <v-text-field v-model="form.custom_zip_code" maxlength="10" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="대표자명">
        <v-text-field v-model="form.custom_representative_name" maxlength="20" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="홈페이지 주소">
        <v-text-field v-model="form.website" maxlength="100" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" class="mt-6">
      <v-divider class="mb-6" />
      <h6 class="text-h6">전자세금계산서</h6>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="이름" required>
        <v-text-field v-model="form.custom_tax_invoice_name" maxlength="30" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="부서">
        <v-text-field v-model="form.custom_tax_invoice_department" maxlength="30" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="4">
      <LabelWithElement title="직급">
        <v-text-field v-model="form.custom_tax_invoice_position" maxlength="20" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="휴대폰번호" required>
        <v-text-field v-model="form.custom_tax_invoice_mobile" maxlength="15" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="이메일" required>
        <v-text-field v-model="form.custom_tax_invoice_email" maxlength="50" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" class="mt-6">
      <v-divider class="mb-6" />
      <h6 class="text-h6">기타</h6>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="비고">
        <v-textarea v-model="form.customer_details" maxlength="250" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="사용여부">
        <v-radio-group v-model="form.useOrNot" inline hide-details>
          <v-radio color="primary" label="사용" value="Y" />
          <v-radio color="primary" label="미사용" value="N" />
        </v-radio-group>
      </LabelWithElement>
    </v-col>
  </v-row>
</template>
