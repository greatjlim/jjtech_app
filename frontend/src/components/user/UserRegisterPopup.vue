<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import UserFormFields from './UserFormFields.vue'
import { createUser, emptyUserForm, formToCreatePayload } from '@/api/user'
import { ApiError } from '@/api/client'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: []; error: [message: string] }>()

const saving = ref(false)
const form = reactive(emptyUserForm())

watch(show, (newShow) => {
  if (newShow) {
    Object.assign(form, emptyUserForm())
  }
})

const save = async () => {
  saving.value = true
  try {
    await createUser(formToCreatePayload(form))
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
  <FormDialog v-model="show" title="사용자 신규 등록" :loading="saving" @save="save">
    <UserFormFields v-model="form" mode="create" />
  </FormDialog>
</template>
