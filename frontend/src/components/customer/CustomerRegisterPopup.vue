<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import CustomerFormDialog from './CustomerFormDialog.vue'
import CustomerFormFields from './CustomerFormFields.vue'
import { createCustomer, emptyCustomerForm, formToCreatePayload } from '@/api/customer'
import { ApiError } from '@/api/client'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const saving = ref(false)
const form = reactive(emptyCustomerForm())

watch(show, (newShow) => {
  if (newShow) {
    Object.assign(form, emptyCustomerForm())
  }
})

const save = async () => {
  saving.value = true
  try {
    await createCustomer(formToCreatePayload(form))
    show.value = false
    emit('saved')
  } catch (e) {
    emit('error', e instanceof ApiError ? e.message : '저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <CustomerFormDialog v-model="show" title="거래처 신규 등록" :loading="saving" @save="save">
    <CustomerFormFields v-model="form" mode="create" />
  </CustomerFormDialog>
</template>
