<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type CellClickedEvent,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type IDatasource,
  type IGetRowsParams,
  type SelectionChangedEvent,
  type ValueFormatterParams,
} from 'ag-grid-community'
import {
  cancelSalesOrder,
  deleteSalesOrder,
  getSalesOrderFieldOptions,
  listSalesOrderItems,
  listSalesOrders,
  submitSalesOrder,
  STATUS_LABELS,
  type SalesOrderItemListItem,
  type SalesOrderListItem,
} from '@/api/salesOrder'
import { ApiError } from '@/api/client'
import SalesOrderRowActions from '@/components/salesOrder/SalesOrderRowActions.vue'
import SalesOrderModifyPopup from '@/components/salesOrder/SalesOrderModifyPopup.vue'
import SalesOrderRegisterPopup from '@/components/salesOrder/SalesOrderRegisterPopup.vue'

ModuleRegistry.registerModules([AllCommunityModule])

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const notifySuccess = (message: string) => {
  snackbarColor.value = 'success'
  snackbarText.value = message
  snackbar.value = true
}

const notifyError = (message: string) => {
  snackbarColor.value = 'error'
  snackbarText.value = message
  snackbar.value = true
}

// 조회조건
const status = ref('all')
const searchQuery = ref('')
const showAdvanced = ref(false)
const orderDateStart = ref('')
const orderDateEnd = ref('')
const deliveryDateStart = ref('')
const deliveryDateEnd = ref('')

const statusOptions = ref<string[]>([])

onMounted(async () => {
  statusOptions.value = await getSalesOrderFieldOptions('status')
})

// 수주마스터 그리드
const orderGridApi = shallowRef<GridApi | null>(null)
const orderTotalCount = ref<number | undefined>(undefined)
const selectedOrderName = ref('')

const showModify = ref(false)
const showRegister = ref(false)
const editingName = ref('')

const editOrder = (name: string) => {
  editingName.value = name
  showModify.value = true
}

const onSaved = () => {
  notifySuccess('저장되었습니다.')
  refreshOrderGrid()
}

const submitOrder = async (name: string) => {
  if (!window.confirm('이 수주를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) return
  try {
    await submitSalesOrder(name)
    notifySuccess('제출되었습니다.')
    refreshOrderGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '제출에 실패했습니다.')
  }
}

const cancelOrder = async (name: string) => {
  if (!window.confirm('제출을 취소하시겠습니까?')) return
  try {
    await cancelSalesOrder(name)
    notifySuccess('제출이 취소되었습니다.')
    refreshOrderGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '제출취소에 실패했습니다.')
  }
}

const deleteOrder = async (name: string) => {
  if (!window.confirm('수주 정보를 삭제하시겠습니까?')) return
  try {
    await deleteSalesOrder(name)
    notifySuccess('삭제되었습니다.')
    if (selectedOrderName.value === name) selectedOrderName.value = ''
    refreshOrderGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
  }
}

const orderColumnDefs: ColDef<SalesOrderListItem>[] = [
  { headerName: '주문번호', field: 'name', width: 160 },
  { headerName: '수주일자', field: 'transaction_date', width: 120 },
  {
    headerName: '진행상태',
    field: 'status',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => STATUS_LABELS[params.value] ?? params.value,
  },
  { headerName: '수주처명', field: 'customer_name', width: 180 },
  { headerName: '현장명', field: 'custom_site_company_name', width: 160 },
  {
    headerName: '배송지주소',
    width: 240,
    valueGetter: (params) => {
      const data = params.data as SalesOrderListItem | undefined
      if (!data) return ''
      return [data.custom_delivery_address, data.custom_delivery_address_detail].filter(Boolean).join(' ')
    },
  },
  { headerName: '납기예정일자', field: 'delivery_date', width: 130 },
  {
    headerName: '실행',
    sortable: false,
    cellRenderer: SalesOrderRowActions,
    cellRendererParams: { onEdit: editOrder, onSubmit: submitOrder, onCancel: cancelOrder, onDelete: deleteOrder },
    width: 100,
  },
]

const buildOrderDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listSalesOrders(
        {
          search: searchQuery.value || undefined,
          status: status.value === 'all' ? undefined : status.value,
          orderDateStart: showAdvanced.value ? orderDateStart.value || undefined : undefined,
          orderDateEnd: showAdvanced.value ? orderDateEnd.value || undefined : undefined,
          deliveryDateStart: showAdvanced.value ? deliveryDateStart.value || undefined : undefined,
          deliveryDateEnd: showAdvanced.value ? deliveryDateEnd.value || undefined : undefined,
        },
        params.startRow,
        params.endRow - params.startRow,
      )
      orderTotalCount.value = total
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onOrderGridReady = (event: GridReadyEvent) => {
  orderGridApi.value = event.api
  event.api.setGridOption('datasource', buildOrderDatasource())
}

const refreshOrderGrid = () => {
  orderGridApi.value?.setGridOption('datasource', buildOrderDatasource())
}

const onOrderSelectionChanged = (event: SelectionChangedEvent<SalesOrderListItem>) => {
  const rows = event.api.getSelectedRows()
  selectedOrderName.value = rows[0]?.name ?? ''
}

// "실행" 컬럼(field 없음)을 클릭했을 때는 그 안의 버튼이 처리하므로 팝업을 띄우지 않는다.
const onOrderCellClicked = (event: CellClickedEvent<SalesOrderListItem>) => {
  if (!event.colDef.field || !event.data) return
  editOrder(event.data.name)
}

let debounceHandle: number | undefined
watch([status, searchQuery, orderDateStart, orderDateEnd, deliveryDateStart, deliveryDateEnd], () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(refreshOrderGrid, 400)
})

// 수주상세내역 그리드 (읽기전용, 선택된 주문의 라인)
const lineGridApi = shallowRef<GridApi | null>(null)
const lineTotalCount = ref<number | undefined>(undefined)
const lineSummary = ref({ qty: 0, amount: 0 })

const lineColumnDefs: ColDef<SalesOrderItemListItem>[] = [
  { headerName: '품명', field: 'item_name', width: 220 },
  { headerName: '금형', field: 'custom_mold', width: 140 },
  { headerName: '주문수량', field: 'qty', width: 100 },
  { headerName: '규격', field: 'custom_order_spec', width: 120 },
  { headerName: '수주중량', field: 'custom_order_weight', width: 100 },
  {
    headerName: '단가',
    field: 'rate',
    width: 120,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
  {
    headerName: '금액',
    field: 'amount',
    width: 120,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
]

const buildLineDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listSalesOrderItems(selectedOrderName.value, params.startRow, params.endRow - params.startRow)
      lineTotalCount.value = total
      lineSummary.value = items.reduce(
        (acc, item) => ({ qty: acc.qty + (item.qty || 0), amount: acc.amount + (item.amount || 0) }),
        { qty: 0, amount: 0 },
      )
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onLineGridReady = (event: GridReadyEvent) => {
  lineGridApi.value = event.api
  event.api.setGridOption('datasource', buildLineDatasource())
}

const refreshLineGrid = () => {
  lineGridApi.value?.setGridOption('datasource', buildLineDatasource())
}

watch(selectedOrderName, () => {
  refreshLineGrid()
})

const defaultColDef = { cellClass: ['d-flex', 'align-center'] }
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">주문관리</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-row class="align-end">
        <v-col cols="12" lg="6">
          <v-radio-group v-model="status" inline hide-details label="진행상태">
            <v-radio label="전체" color="primary" value="all" />
            <v-radio
              v-for="opt in statusOptions"
              :key="opt"
              :label="STATUS_LABELS[opt] ?? opt"
              color="primary"
              :value="opt"
            />
          </v-radio-group>
        </v-col>
        <v-col cols="12" lg="6">
          <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="검색..." hide-details color="primary" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-btn variant="text" color="primary" @click="showAdvanced = !showAdvanced">
            상세검색 {{ showAdvanced ? '접기' : '펼치기' }}
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-if="showAdvanced">
        <v-col cols="12" md="6" lg="3">
          <v-text-field v-model="orderDateStart" type="date" label="주문일자(시작)" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-text-field v-model="orderDateEnd" type="date" label="주문일자(종료)" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-text-field v-model="deliveryDateStart" type="date" label="납기일자(시작)" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-text-field v-model="deliveryDateEnd" type="date" label="납기일자(종료)" variant="outlined" density="comfortable" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" class="d-flex align-center justify-space-between">
          <h3 class="text-h6 mb-2">
            수주마스터
            <span v-if="orderTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ orderTotalCount }}</span> 건
            </span>
          </h3>
          <v-tooltip location="top" text="등록하기">
            <template #activator="{ props: tooltipProps }">
              <v-avatar size="35">
                <v-btn v-bind="tooltipProps" class="rounded-circle" color="primary" flat @click="showRegister = true">
                  <v-icon color="white">mdi-plus-circle</v-icon>
                </v-btn>
              </v-avatar>
            </template>
          </v-tooltip>
        </v-col>
        <v-col cols="12">
          <ag-grid-vue
            :column-defs="orderColumnDefs"
            :default-col-def="defaultColDef"
            row-model-type="infinite"
            :cache-block-size="100"
            :cache-overflow-size="1"
            :max-concurrent-datasource-requests="2"
            :infinite-initial-row-count="1"
            :max-blocks-in-cache="2"
            :row-selection="{ mode: 'singleRow', enableClickSelection: true }"
            :theme="themeQuartz"
            :row-height="42"
            style="height: 400px; width: 100%"
            suppress-drag-leave-hides-columns
            @grid-ready="onOrderGridReady"
            @selection-changed="onOrderSelectionChanged"
            @cell-clicked="onOrderCellClicked"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-h6 mb-2">
            수주상세내역
            <span v-if="lineTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ lineTotalCount }}</span> 건 · 수량
              {{ lineSummary.qty.toLocaleString() }} · 금액 {{ lineSummary.amount.toLocaleString() }}
            </span>
          </h3>
          <ag-grid-vue
            :column-defs="lineColumnDefs"
            :default-col-def="defaultColDef"
            row-model-type="infinite"
            :cache-block-size="100"
            :cache-overflow-size="1"
            :max-concurrent-datasource-requests="2"
            :infinite-initial-row-count="1"
            :max-blocks-in-cache="2"
            :theme="themeQuartz"
            :row-height="42"
            style="height: 300px; width: 100%"
            suppress-drag-leave-hides-columns
            @grid-ready="onLineGridReady"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <SalesOrderModifyPopup v-model="showModify" :name="editingName" @saved="onSaved" @error="notifyError" />
  <SalesOrderRegisterPopup v-model="showRegister" @saved="onSaved" @error="notifyError" />

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
