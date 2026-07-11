<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import PurchaseOrderFormFields from './PurchaseOrderFormFields.vue'
import { createPurchaseOrder, emptyPurchaseOrderForm, formToCreatePayload } from '@/api/purchaseOrder'
import { ApiError } from '@/api/client'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const saving = ref(false)
const form = reactive(emptyPurchaseOrderForm())

watch(show, (newShow) => {
  if (newShow) {
    Object.assign(form, emptyPurchaseOrderForm())
  }
})

const save = async () => {
  saving.value = true
  try {
    await createPurchaseOrder(formToCreatePayload(form))
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
  <FormDialog v-model="show" title="발주관리 신규 등록" :loading="saving" @save="save">
    <PurchaseOrderFormFields v-model="form" />
  </FormDialog>
</template>
