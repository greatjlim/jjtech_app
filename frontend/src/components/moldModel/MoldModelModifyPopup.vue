<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import MoldModelFormFields from './MoldModelFormFields.vue'
import { emptyMoldModelForm, getMoldModel, updateMoldModel } from '@/api/moldModel'
import { ApiError } from '@/api/client'

const props = defineProps<{
  modelNumber: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const loading = ref(false)
const saving = ref(false)
const form = reactive(emptyMoldModelForm())

const load = async () => {
  if (!props.modelNumber) return
  loading.value = true
  try {
    const doc = await getMoldModel(props.modelNumber)
    Object.assign(form, doc)
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
    await updateMoldModel(props.modelNumber, form)
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
  <FormDialog v-model="show" title="형번마스터" :loading="loading || saving" @save="save">
    <MoldModelFormFields v-model="form" mode="edit" />
  </FormDialog>
</template>
