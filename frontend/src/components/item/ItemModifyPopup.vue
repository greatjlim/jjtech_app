<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import ItemFormFields from './ItemFormFields.vue'
import { emptyItemForm, formToUpdatePayload, getItem, itemDocToForm, updateItem } from '@/api/item'
import { ApiError } from '@/api/client'

const props = defineProps<{
  name: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const loading = ref(false)
const saving = ref(false)
const form = reactive(emptyItemForm())

const load = async () => {
  if (!props.name) return
  loading.value = true
  try {
    const doc = await getItem(props.name)
    Object.assign(form, itemDocToForm(doc))
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
    await updateItem(props.name, formToUpdatePayload(form))
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
  <FormDialog v-model="show" title="물품 수정" :loading="loading || saving" @save="save">
    <ItemFormFields v-model="form" mode="edit" />
  </FormDialog>
</template>
