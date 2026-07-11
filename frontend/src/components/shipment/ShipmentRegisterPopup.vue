<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import ShipmentFormFields from './ShipmentFormFields.vue'
import { createShipment, emptyShipmentForm, formToCreatePayload } from '@/api/shipment'
import { ApiError } from '@/api/client'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const saving = ref(false)
const form = reactive(emptyShipmentForm())

watch(show, (newShow) => {
  if (newShow) {
    Object.assign(form, emptyShipmentForm())
  }
})

const save = async () => {
  saving.value = true
  try {
    await createShipment(formToCreatePayload(form))
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
  <FormDialog v-model="show" title="출고관리 신규 등록" :loading="saving" @save="save">
    <ShipmentFormFields v-model="form" />
  </FormDialog>
</template>
