<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import PurchaseReceiptFormFields from './PurchaseReceiptFormFields.vue'
import {
  emptyPurchaseReceiptForm,
  formToCreatePayload,
  getPurchaseReceipt,
  listPurchaseReceiptItems,
  purchaseReceiptDocToForm,
  updatePurchaseReceipt,
} from '@/api/purchaseReceipt'
import { ApiError } from '@/api/client'

const props = defineProps<{
  name: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const loading = ref(false)
const saving = ref(false)
const docstatus = ref<0 | 1 | 2>(0)
const form = reactive(emptyPurchaseReceiptForm())

const isReadonly = computed(() => docstatus.value !== 0)

const load = async () => {
  if (!props.name) return
  loading.value = true
  try {
    const doc = await getPurchaseReceipt(props.name)
    const { items } = await listPurchaseReceiptItems(props.name, 0, 1000)
    docstatus.value = doc.docstatus
    Object.assign(form, purchaseReceiptDocToForm(doc, items))
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
    await updatePurchaseReceipt(props.name, formToCreatePayload(form))
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
  <FormDialog v-model="show" title="입고관리" :loading="loading || saving" :hide-save="isReadonly" @save="save">
    <PurchaseReceiptFormFields v-model="form" :readonly="isReadonly" />
  </FormDialog>
</template>
