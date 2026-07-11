<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import ItemFormFields from './ItemFormFields.vue'
import { createItem, emptyItemForm, formToCreatePayload } from '@/api/item'
import { ApiError } from '@/api/client'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const saving = ref(false)
const form = reactive(emptyItemForm())

watch(show, (newShow) => {
  if (newShow) {
    Object.assign(form, emptyItemForm())
  }
})

const save = async () => {
  saving.value = true
  try {
    await createItem(formToCreatePayload(form))
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
  <FormDialog v-model="show" title="물품 신규 등록" :loading="saving" @save="save">
    <ItemFormFields v-model="form" mode="create" />
  </FormDialog>
</template>
