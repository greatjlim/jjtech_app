<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import ShipmentFormFields from './ShipmentFormFields.vue'
import {
  emptyShipmentForm,
  formToCreatePayload,
  getShipment,
  listShipmentItems,
  shipmentDocToForm,
  updateShipment,
} from '@/api/shipment'
import { ApiError } from '@/api/client'

const props = defineProps<{
  name: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const loading = ref(false)
const saving = ref(false)
const docstatus = ref<0 | 1 | 2>(0)
const form = reactive(emptyShipmentForm())

const isReadonly = computed(() => docstatus.value !== 0)

const load = async () => {
  if (!props.name) return
  loading.value = true
  try {
    const doc = await getShipment(props.name)
    const { items } = await listShipmentItems(props.name, 0, 1000)
    docstatus.value = doc.docstatus
    Object.assign(form, shipmentDocToForm(doc, items))
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
    await updateShipment(props.name, formToCreatePayload(form))
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
  <FormDialog v-model="show" title="출고관리" :loading="loading || saving" :hide-save="isReadonly" @save="save">
    <ShipmentFormFields v-model="form" :readonly="isReadonly" />
  </FormDialog>
</template>
