<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import WorkOrderFormFields from './WorkOrderFormFields.vue'
import { createWorkOrder, emptyWorkOrderForm, formToCreatePayload } from '@/api/workOrder'
import { ApiError } from '@/api/client'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const saving = ref(false)
const form = reactive(emptyWorkOrderForm())

watch(show, (newShow) => {
  if (newShow) {
    Object.assign(form, emptyWorkOrderForm())
  }
})

const save = async () => {
  saving.value = true
  try {
    await createWorkOrder(formToCreatePayload(form))
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
  <FormDialog v-model="show" title="작업지시 신규 등록" :loading="saving" @save="save">
    <WorkOrderFormFields v-model="form" />
  </FormDialog>
</template>
