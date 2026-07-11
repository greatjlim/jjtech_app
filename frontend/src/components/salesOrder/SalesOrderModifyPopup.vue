<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import SalesOrderFormFields from './SalesOrderFormFields.vue'
import { emptySalesOrderForm, getSalesOrder, listSalesOrderItems, salesOrderDocToForm } from '@/api/salesOrder'

const props = defineProps<{
  name: string
}>()
const show = defineModel<boolean>({ default: false })

const loading = ref(false)
const docstatus = ref<0 | 1 | 2>(0)
const form = reactive(emptySalesOrderForm())

const isReadonly = computed(() => docstatus.value !== 0)

const load = async () => {
  if (!props.name) return
  loading.value = true
  try {
    const doc = await getSalesOrder(props.name)
    const { items } = await listSalesOrderItems(props.name, 0, 1000)
    docstatus.value = doc.docstatus
    Object.assign(form, salesOrderDocToForm(doc, items))
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
  <FormDialog v-model="show" title="수주관리" :loading="loading" :hide-save="isReadonly" @save="save">
    <SalesOrderFormFields v-model="form" :readonly="isReadonly" />
  </FormDialog>
</template>
