<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import WorkOrderFormFields from './WorkOrderFormFields.vue'
import { emptyWorkOrderForm, formToCreatePayload, getWorkOrder, updateWorkOrder, workOrderDocToForm } from '@/api/workOrder'
import { ApiError } from '@/api/client'

const props = defineProps<{
  name: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const loading = ref(false)
const saving = ref(false)
const docstatus = ref<0 | 1 | 2>(0)
const form = reactive(emptyWorkOrderForm())

const isReadonly = computed(() => docstatus.value !== 0)

const load = async () => {
  if (!props.name) return
  loading.value = true
  try {
    const doc = await getWorkOrder(props.name)
    docstatus.value = doc.docstatus
    Object.assign(form, workOrderDocToForm(doc))
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
    await updateWorkOrder(props.name, formToCreatePayload(form))
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
  <FormDialog v-model="show" title="작업지시" :loading="loading || saving" :hide-save="isReadonly" @save="save">
    <WorkOrderFormFields v-model="form" :readonly="isReadonly" :current-name="props.name" />
  </FormDialog>
</template>
