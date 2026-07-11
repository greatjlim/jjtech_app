<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import SalesOrderLineDialog from './SalesOrderLineDialog.vue'
import { listCustomers } from '@/api/customer'
import type { SalesOrderFormLine, SalesOrderFormState } from '@/api/salesOrder'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  { readonly: false },
)

const form = defineModel<SalesOrderFormState>({ required: true })

const customerOptions = ref<{ name: string; customer_name: string }[]>([])

onMounted(async () => {
  const { items } = await listCustomers('', 0, 100)
  customerOptions.value = items
})

const showLineDialog = ref(false)

const addLine = (line: SalesOrderFormLine) => {
  form.value.items.push(line)
}

const removeLine = (index: number) => {
  form.value.items.splice(index, 1)
}
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="수주처" required>
        <v-autocomplete
          v-model="form.customer"
          :items="customerOptions"
          item-title="customer_name"
          item-value="name"
          :disabled="readonly"
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="현장명">
        <v-text-field v-model="form.custom_site_company_name" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="주문일자" required>
        <v-text-field v-model="form.transaction_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="납기일자" required>
        <v-text-field v-model="form.delivery_date" type="date" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="배송지주소">
        <v-text-field v-model="form.custom_delivery_address" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="배송지상세주소">
        <v-text-field v-model="form.custom_delivery_address_detail" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="비고">
        <v-textarea v-model="form.custom_remark" :disabled="readonly" />
      </LabelWithElement>
    </v-col>
  </v-row>

  <v-divider class="my-4" />
  <div class="d-flex align-center justify-space-between mb-2">
    <h6 class="text-h6">주문 품목</h6>
    <v-btn v-if="!readonly" color="primary" variant="text" prepend-icon="mdi-plus" @click="showLineDialog = true">
      품목 추가
    </v-btn>
  </div>
  <v-table density="comfortable">
    <thead>
      <tr>
        <th>품명</th>
        <th>금형</th>
        <th>규격</th>
        <th>수량</th>
        <th>중량</th>
        <th>단가</th>
        <th>금액</th>
        <th v-if="!readonly" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="(line, index) in form.items" :key="index">
        <td>{{ line.item_name }}</td>
        <td>{{ line.custom_mold }}</td>
        <td>{{ line.custom_order_spec }}</td>
        <td>{{ line.qty }}</td>
        <td>{{ line.custom_order_weight }}</td>
        <td>{{ line.rate.toLocaleString() }}</td>
        <td>{{ (line.qty * line.rate).toLocaleString() }}</td>
        <td v-if="!readonly">
          <v-btn icon size="small" variant="plain" @click="removeLine(index)">
            <v-icon color="error">mdi-delete</v-icon>
          </v-btn>
        </td>
      </tr>
      <tr v-if="form.items.length === 0">
        <td colspan="8" class="text-center text-medium-emphasis">등록된 품목이 없습니다</td>
      </tr>
    </tbody>
  </v-table>

  <SalesOrderLineDialog v-model="showLineDialog" @add="addLine" />
</template>
