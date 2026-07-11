<script setup lang="ts">
import { ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import { searchItems, type ItemListItem } from '@/api/item'
import { listCustomers, type CustomerListItem } from '@/api/customer'
import {
  listShippableSalesOrderItems,
  listShippablePackagings,
  type ShipmentFormLine,
  type ShippableSalesOrderItem,
  type ShippablePackaging,
} from '@/api/shipment'

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ add: [line: ShipmentFormLine] }>()

const tab = ref<'so' | 'packaging' | 'manual'>('so')

// 수주 가져오기
const soSearch = ref('')
const soResults = ref<ShippableSalesOrderItem[]>([])
const soLoading = ref(false)

const searchSo = async () => {
  soLoading.value = true
  try {
    soResults.value = await listShippableSalesOrderItems(soSearch.value || undefined)
  } finally {
    soLoading.value = false
  }
}

const addFromSo = (row: ShippableSalesOrderItem) => {
  emit('add', {
    item_code: row.item_code,
    item_name: row.item_name,
    customer: row.customer,
    customer_name: row.customer_name,
    mold_model: row.mold_model ?? '',
    spec: row.spec ?? '',
    color: row.color ?? '',
    material: row.material ?? '',
    heat_treatment: row.heat_treatment ?? '',
    sales_order: row.sales_order,
    sales_order_item: row.sales_order_item,
    packaging: '',
    order_qty: row.order_qty,
    ship_qty: row.remaining_qty,
    ship_weight: row.order_weight ?? 0,
  })
  show.value = false
}

// 포장미출고 가져오기
const pkgSearch = ref('')
const pkgResults = ref<ShippablePackaging[]>([])
const pkgLoading = ref(false)

const searchPkg = async () => {
  pkgLoading.value = true
  try {
    pkgResults.value = await listShippablePackagings(pkgSearch.value || undefined)
  } finally {
    pkgLoading.value = false
  }
}

const addFromPkg = (row: ShippablePackaging) => {
  if (!row.item_code) return
  emit('add', {
    item_code: row.item_code,
    item_name: row.item_name ?? '',
    customer: row.customer ?? '',
    customer_name: row.customer_name ?? '',
    mold_model: row.mold_model ?? '',
    spec: row.spec ?? '',
    color: row.color ?? '',
    material: row.material ?? '',
    heat_treatment: row.heat_treatment ?? '',
    sales_order: row.sales_order ?? '',
    sales_order_item: row.sales_order_item ?? '',
    packaging: row.packaging,
    order_qty: 0,
    ship_qty: row.remaining_qty,
    ship_weight: 0,
  })
  show.value = false
}

// 직접입력
const itemOptions = ref<ItemListItem[]>([])
const customerOptions = ref<CustomerListItem[]>([])
const manualItemCode = ref('')
const manualItemName = ref('')
const manualCustomer = ref('')
const manualCustomerName = ref('')
const manualMold = ref('')
const manualSpec = ref('')
const manualColor = ref('')
const manualMaterial = ref('')
const manualHeatTreatment = ref('')
const manualQty = ref(1)
const manualWeight = ref(0)

watch(manualItemCode, (code) => {
  const found = itemOptions.value.find((i) => i.name === code)
  manualItemName.value = found?.item_name ?? ''
})
watch(manualCustomer, (code) => {
  const found = customerOptions.value.find((c) => c.name === code)
  manualCustomerName.value = found?.customer_name ?? ''
})

const resetManual = () => {
  manualItemCode.value = ''
  manualItemName.value = ''
  manualCustomer.value = ''
  manualCustomerName.value = ''
  manualMold.value = ''
  manualSpec.value = ''
  manualColor.value = ''
  manualMaterial.value = ''
  manualHeatTreatment.value = ''
  manualQty.value = 1
  manualWeight.value = 0
}

const addManual = () => {
  emit('add', {
    item_code: manualItemCode.value,
    item_name: manualItemName.value,
    customer: manualCustomer.value,
    customer_name: manualCustomerName.value,
    mold_model: manualMold.value,
    spec: manualSpec.value,
    color: manualColor.value,
    material: manualMaterial.value,
    heat_treatment: manualHeatTreatment.value,
    sales_order: '',
    sales_order_item: '',
    packaging: '',
    order_qty: 0,
    ship_qty: manualQty.value,
    ship_weight: manualWeight.value,
  })
  show.value = false
}

const init = async () => {
  tab.value = 'so'
  soSearch.value = ''
  pkgSearch.value = ''
  resetManual()
  ;[soResults.value, pkgResults.value, itemOptions.value, customerOptions.value] = await Promise.all([
    listShippableSalesOrderItems(),
    listShippablePackagings(),
    searchItems(''),
    listCustomers('', 0, 100).then((r) => r.items),
  ])
}

watch(show, (newShow) => {
  if (newShow) init()
})
</script>

<template>
  <FormDialog v-model="show" title="출고상세 라인 추가" hide-save>
    <v-tabs v-model="tab" color="primary">
      <v-tab value="so">수주 가져오기</v-tab>
      <v-tab value="packaging">포장미출고 가져오기</v-tab>
      <v-tab value="manual">직접입력</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-4">
      <v-window-item value="so">
        <div class="d-flex align-center mb-2" style="gap: 8px">
          <v-text-field
            v-model="soSearch"
            prepend-inner-icon="mdi-magnify"
            label="거래처/수주번호/품명 검색..."
            hide-details
            density="comfortable"
            @keyup.enter="searchSo"
          />
          <v-btn color="primary" variant="tonal" :loading="soLoading" @click="searchSo">검색</v-btn>
        </div>
        <v-table density="comfortable" height="360" fixed-header>
          <thead>
            <tr>
              <th>수주번호</th>
              <th>거래처</th>
              <th>품명</th>
              <th>형번</th>
              <th>규격</th>
              <th>주문수량</th>
              <th>미출고수량</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in soResults" :key="row.sales_order_item">
              <td>{{ row.sales_order }}</td>
              <td>{{ row.customer_name }}</td>
              <td>{{ row.item_name }}</td>
              <td>{{ row.mold_model }}</td>
              <td>{{ row.spec }}</td>
              <td>{{ row.order_qty }}</td>
              <td>{{ row.remaining_qty }}</td>
              <td>
                <v-btn size="small" color="primary" variant="text" @click="addFromSo(row)">추가</v-btn>
              </td>
            </tr>
            <tr v-if="soResults.length === 0">
              <td colspan="8" class="text-center text-medium-emphasis">출고 가능한 수주 라인이 없습니다</td>
            </tr>
          </tbody>
        </v-table>
      </v-window-item>

      <v-window-item value="packaging">
        <div class="d-flex align-center mb-2" style="gap: 8px">
          <v-text-field
            v-model="pkgSearch"
            prepend-inner-icon="mdi-magnify"
            label="거래처/포장번호/품명 검색..."
            hide-details
            density="comfortable"
            @keyup.enter="searchPkg"
          />
          <v-btn color="primary" variant="tonal" :loading="pkgLoading" @click="searchPkg">검색</v-btn>
        </div>
        <v-table density="comfortable" height="360" fixed-header>
          <thead>
            <tr>
              <th>포장번호</th>
              <th>거래처</th>
              <th>품명</th>
              <th>형번</th>
              <th>포장수량</th>
              <th>미출고수량</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pkgResults" :key="row.packaging">
              <td>{{ row.packaging }}</td>
              <td>{{ row.customer_name }}</td>
              <td>{{ row.item_name }}</td>
              <td>{{ row.mold_model }}</td>
              <td>{{ row.pack_qty }}</td>
              <td>{{ row.remaining_qty }}</td>
              <td>
                <v-btn size="small" color="primary" variant="text" :disabled="!row.item_code" @click="addFromPkg(row)">
                  추가
                </v-btn>
              </td>
            </tr>
            <tr v-if="pkgResults.length === 0">
              <td colspan="7" class="text-center text-medium-emphasis">출고 가능한 포장건이 없습니다</td>
            </tr>
          </tbody>
        </v-table>
      </v-window-item>

      <v-window-item value="manual">
        <v-row class="mt-1">
          <v-col cols="12" md="6">
            <LabelWithElement title="품명" required>
              <v-autocomplete
                v-model="manualItemCode"
                :items="itemOptions"
                item-title="item_name"
                item-value="name"
                variant="outlined"
                density="comfortable"
              />
            </LabelWithElement>
          </v-col>
          <v-col cols="12" md="6">
            <LabelWithElement title="거래처" required>
              <v-autocomplete
                v-model="manualCustomer"
                :items="customerOptions"
                item-title="customer_name"
                item-value="name"
                variant="outlined"
                density="comfortable"
              />
            </LabelWithElement>
          </v-col>
          <v-col cols="12" md="4">
            <LabelWithElement title="형번">
              <v-text-field v-model="manualMold" />
            </LabelWithElement>
          </v-col>
          <v-col cols="12" md="4">
            <LabelWithElement title="규격">
              <v-text-field v-model="manualSpec" />
            </LabelWithElement>
          </v-col>
          <v-col cols="12" md="4">
            <LabelWithElement title="색상">
              <v-text-field v-model="manualColor" />
            </LabelWithElement>
          </v-col>
          <v-col cols="12" md="4">
            <LabelWithElement title="재질">
              <v-text-field v-model="manualMaterial" />
            </LabelWithElement>
          </v-col>
          <v-col cols="12" md="4">
            <LabelWithElement title="열처리방법">
              <v-text-field v-model="manualHeatTreatment" />
            </LabelWithElement>
          </v-col>
          <v-col cols="12" md="4">
            <LabelWithElement title="출고수량" required>
              <v-text-field v-model.number="manualQty" type="number" />
            </LabelWithElement>
          </v-col>
          <v-col cols="12" md="4">
            <LabelWithElement title="출고중량">
              <v-text-field v-model.number="manualWeight" type="number" suffix="kg" />
            </LabelWithElement>
          </v-col>
        </v-row>
        <div class="d-flex justify-end mt-2">
          <v-btn color="primary" variant="tonal" :disabled="!manualItemCode || !manualCustomer" @click="addManual">
            추가
          </v-btn>
        </div>
      </v-window-item>
    </v-window>
  </FormDialog>
</template>
