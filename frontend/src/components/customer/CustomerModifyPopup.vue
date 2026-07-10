<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import CustomerFormDialog from './CustomerFormDialog.vue'
import CustomerFormFields from './CustomerFormFields.vue'
import { customerDocToForm, emptyCustomerForm, formToUpdatePayload, getCustomer, updateCustomer } from '@/api/customer'
import { ApiError } from '@/api/client'

const props = defineProps<{
  name: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const loading = ref(false)
const saving = ref(false)
const form = reactive(emptyCustomerForm())

const load = async () => {
  if (!props.name) return
  loading.value = true
  try {
    const doc = await getCustomer(props.name)
    Object.assign(form, customerDocToForm(doc))
  } finally {
    loading.value = false
  }
}

watch(show, (newShow) => {
  if (newShow) {
    load()
  }
})

const save = async () => {
  saving.value = true
  try {
    await updateCustomer(props.name, formToUpdatePayload(form))
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
  <CustomerFormDialog v-model="show" title="거래처 수정" :loading="loading || saving" @save="save">
    <CustomerFormFields v-model="form" mode="edit" />
  </CustomerFormDialog>
</template>
