<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import MoldFormFields from './MoldFormFields.vue'
import { createMold, emptyMoldForm } from '@/api/mold'
import { ApiError } from '@/api/client'

const props = defineProps<{
  moldModel: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const saving = ref(false)
const form = reactive(emptyMoldForm(props.moldModel))

watch(show, (newShow) => {
  if (newShow) {
    Object.assign(form, emptyMoldForm(props.moldModel))
  }
})

const save = async () => {
  saving.value = true
  try {
    await createMold(form)
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
  <FormDialog v-model="show" title="금형 신규 등록" :loading="saving" @save="save">
    <MoldFormFields v-model="form" mode="create" />
  </FormDialog>
</template>
