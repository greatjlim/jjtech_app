<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteCompany, getCompany, updateCompany, type CompanyDoc, type CompanyUpdatePayload } from '@/api/company'
import { ApiError } from '@/api/client'
import LabelWithElement from '@/components/LabelWithElement.vue'

const route = useRoute()
const router = useRouter()
const name = route.params.name as string

const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

const form = reactive<CompanyDoc>({
  name: '',
  company_name: '',
  abbr: '',
  tax_id: '',
  phone_no: '',
  fax: '',
  email: '',
  website: '',
  country: '',
  default_currency: '',
  is_group: 0,
  parent_company: '',
})

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const load = async () => {
  loading.value = true
  const doc = await getCompany(name)
  Object.assign(form, doc)
  loading.value = false
}

onMounted(load)

const save = async () => {
  saving.value = true
  try {
    const patch: CompanyUpdatePayload = {
      abbr: form.abbr,
      tax_id: form.tax_id,
      phone_no: form.phone_no,
      fax: form.fax,
      email: form.email,
      website: form.website,
      country: form.country,
      default_currency: form.default_currency,
      is_group: form.is_group,
      parent_company: form.parent_company,
    }
    const updated = await updateCompany(name, patch)
    Object.assign(form, updated)
    snackbarColor.value = 'success'
    snackbarText.value = '저장되었습니다.'
  } catch (e) {
    snackbarColor.value = 'error'
    snackbarText.value = e instanceof ApiError ? e.message : '저장에 실패했습니다.'
  } finally {
    saving.value = false
    snackbar.value = true
  }
}

const remove = async () => {
  if (!window.confirm('회사 정보를 삭제하시겠습니까?')) return
  deleting.value = true
  try {
    await deleteCompany(name)
    router.push('/companies')
  } catch (e) {
    snackbarColor.value = 'error'
    snackbarText.value = e instanceof ApiError ? e.message : '삭제에 실패했습니다.'
    snackbar.value = true
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">회사 상세</h1>
  <v-card elevation="2" :loading="loading">
    <v-card-text>
      <h6 class="text-h6 mb-4">기본정보</h6>
      <v-row>
        <v-col cols="12" md="6">
          <LabelWithElement title="회사명">
            <v-text-field
              v-model="form.company_name"
              disabled
              persistent-hint
              hint="회사명은 여기서 수정할 수 없습니다 (문서 rename 필요)"
            />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="6">
          <LabelWithElement title="약어" required>
            <v-text-field v-model="form.abbr" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="4">
          <LabelWithElement title="사업자등록번호">
            <v-text-field v-model="form.tax_id" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="4">
          <LabelWithElement title="전화번호">
            <v-text-field v-model="form.phone_no" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="4">
          <LabelWithElement title="팩스">
            <v-text-field v-model="form.fax" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="6">
          <LabelWithElement title="이메일">
            <v-text-field v-model="form.email" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="6">
          <LabelWithElement title="홈페이지">
            <v-text-field v-model="form.website" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="4">
          <LabelWithElement title="국가">
            <v-text-field v-model="form.country" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="4">
          <LabelWithElement title="기본통화">
            <v-text-field v-model="form.default_currency" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12" md="4">
          <LabelWithElement title="상위회사">
            <v-text-field v-model="form.parent_company" />
          </LabelWithElement>
        </v-col>
        <v-col cols="12">
          <LabelWithElement title="그룹 회사 여부">
            <v-switch
              v-model="form.is_group"
              :true-value="1"
              :false-value="0"
              color="primary"
              hide-details
              label="그룹 회사"
            />
          </LabelWithElement>
        </v-col>
      </v-row>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <v-btn color="error" variant="text" :loading="deleting" @click="remove">삭제</v-btn>
      <v-spacer />
      <v-btn color="error" variant="text" to="/companies">취소</v-btn>
      <v-btn color="success" variant="text" :loading="saving" @click="save">저장</v-btn>
    </v-card-actions>
  </v-card>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
    {{ snackbarText }}
  </v-snackbar>
</template>
