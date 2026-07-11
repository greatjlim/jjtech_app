<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import SalesOrderFormFields from './SalesOrderFormFields.vue'
import { emptySalesOrderForm } from '@/api/salesOrder'

const show = defineModel<boolean>({ default: false })

const saving = ref(false)
const form = reactive(emptySalesOrderForm())

watch(show, (newShow) => {
  if (newShow) {
    Object.assign(form, emptySalesOrderForm())
  }
})

const save = () => {
  // 저장 API 연결은 다음 단계에서 진행
  show.value = false
}
</script>

<template>
  <FormDialog v-model="show" title="수주관리 신규 등록" :loading="saving" @save="save">
    <SalesOrderFormFields v-model="form" />
  </FormDialog>
</template>
