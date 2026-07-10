<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import CustomerFormDialog from './CustomerFormDialog.vue'
import CustomerFormFields from './CustomerFormFields.vue'
import { customerDocToForm, emptyCustomerForm, getCustomer } from '@/api/customer'

const props = defineProps<{
  name: string
}>()
const show = defineModel<boolean>({ default: false })

const loading = ref(false)
const form = reactive(emptyCustomerForm())

const load = async () => {
  if (!props.name) return
  loading.value = true
  try {
    const doc = await getCustomer(props.name)
    Object.assign(form, customerDocToForm(doc))
  } finally {
    loading.value = false
  }
}

watch(show, (newShow) => {
  if (newShow) {
    load()
  }
})

const save = () => {
  // 저장 API 연결은 다음 단계에서 진행
  show.value = false
}
</script>

<template>
  <CustomerFormDialog v-model="show" title="거래처 수정" :loading="loading" @save="save">
    <CustomerFormFields v-model="form" mode="edit" />
  </CustomerFormDialog>
</template>
