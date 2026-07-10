<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import MoldFormFields from './MoldFormFields.vue'
import { emptyMoldForm, getMold, updateMold } from '@/api/mold'
import { ApiError } from '@/api/client'

const props = defineProps<{
  name: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const loading = ref(false)
const saving = ref(false)
const form = reactive(emptyMoldForm(''))

const load = async () => {
  if (!props.name) return
  loading.value = true
  try {
    const doc = await getMold(props.name)
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
    await updateMold(props.name, form)
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
  <FormDialog v-model="show" title="금형관리" :loading="loading || saving" @save="save">
    <MoldFormFields v-model="form" mode="edit" />
  </FormDialog>
</template>
