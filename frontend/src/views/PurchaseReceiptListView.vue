<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
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
  cancelPurchaseReceipt,
  deletePurchaseReceipt,
  listPurchaseReceiptItems,
  listPurchaseReceipts,
  submitPurchaseReceipt,
  STATUS_LABELS,
  type PurchaseReceiptItemListItem,
  type PurchaseReceiptListItem,
} from '@/api/purchaseReceipt'
import { ApiError } from '@/api/client'
import PurchaseReceiptRowActions from '@/components/purchaseReceipt/PurchaseReceiptRowActions.vue'
import PurchaseReceiptModifyPopup from '@/components/purchaseReceipt/PurchaseReceiptModifyPopup.vue'
import PurchaseReceiptRegisterPopup from '@/components/purchaseReceipt/PurchaseReceiptRegisterPopup.vue'

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
const searchQuery = ref('')
const dateStart = ref('')
const dateEnd = ref('')

// 입고마스터 그리드
const receiptGridApi = shallowRef<GridApi | null>(null)
const receiptTotalCount = ref<number | undefined>(undefined)
const selectedReceiptName = ref('')

const showModify = ref(false)
const showRegister = ref(false)
const editingName = ref('')

const editReceipt = (name: string) => {
  editingName.value = name
  showModify.value = true
}

const onSaved = () => {
  notifySuccess('저장되었습니다.')
  refreshReceiptGrid()
}

const submitReceiptRow = async (name: string) => {
  if (!window.confirm('이 입고를 제출하시겠습니까? 제출 시 실제 재고가 증가합니다.')) return
  try {
    await submitPurchaseReceipt(name)
    notifySuccess('제출되었습니다.')
    refreshReceiptGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '제출에 실패했습니다.')
  }
}

const cancelReceiptRow = async (name: string) => {
  if (!window.confirm('제출을 취소하시겠습니까? 재고가 다시 차감됩니다.')) return
  try {
    await cancelPurchaseReceipt(name)
    notifySuccess('제출이 취소되었습니다.')
    refreshReceiptGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '제출취소에 실패했습니다.')
  }
}

const deleteReceiptRow = async (name: string) => {
  if (!window.confirm('입고 정보를 삭제하시겠습니까?')) return
  try {
    await deletePurchaseReceipt(name)
    notifySuccess('삭제되었습니다.')
    if (selectedReceiptName.value === name) selectedReceiptName.value = ''
    refreshReceiptGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
  }
}

const receiptColumnDefs: ColDef<PurchaseReceiptListItem>[] = [
  { headerName: '입고번호', field: 'name', width: 160 },
  { headerName: '입고일자', field: 'posting_date', width: 120 },
  {
    headerName: '상태',
    field: 'status',
    width: 100,
    valueFormatter: (params: ValueFormatterParams) => STATUS_LABELS[params.value] ?? params.value,
  },
  { headerName: '공급업체명', field: 'supplier_name', width: 180 },
  { headerName: '창고', field: 'set_warehouse', width: 140 },
  { headerName: '비고', field: 'remarks', flex: 1 },
  {
    headerName: '실행',
    sortable: false,
    cellRenderer: PurchaseReceiptRowActions,
    cellRendererParams: { onEdit: editReceipt, onSubmit: submitReceiptRow, onCancel: cancelReceiptRow, onDelete: deleteReceiptRow },
    width: 110,
  },
]

const buildReceiptDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listPurchaseReceipts(
        {
          search: searchQuery.value || undefined,
          dateStart: dateStart.value || undefined,
          dateEnd: dateEnd.value || undefined,
        },
        params.startRow,
        params.endRow - params.startRow,
      )
      receiptTotalCount.value = total
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onReceiptGridReady = (event: GridReadyEvent) => {
  receiptGridApi.value = event.api
  event.api.setGridOption('datasource', buildReceiptDatasource())
}

const refreshReceiptGrid = () => {
  receiptGridApi.value?.setGridOption('datasource', buildReceiptDatasource())
}

const onReceiptSelectionChanged = (event: SelectionChangedEvent<PurchaseReceiptListItem>) => {
  const rows = event.api.getSelectedRows()
  selectedReceiptName.value = rows[0]?.name ?? ''
}

const onReceiptCellClicked = (event: CellClickedEvent<PurchaseReceiptListItem>) => {
  if (!event.colDef.field || !event.data) return
  editReceipt(event.data.name)
}

let debounceHandle: number | undefined
watch([searchQuery, dateStart, dateEnd], () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(refreshReceiptGrid, 400)
})

// 입고상세 그리드 (읽기전용, 선택된 입고건의 라인)
const lineGridApi = shallowRef<GridApi | null>(null)
const lineTotalCount = ref<number | undefined>(undefined)

const lineColumnDefs: ColDef<PurchaseReceiptItemListItem>[] = [
  { headerName: '발주번호', field: 'purchase_order', width: 160 },
  { headerName: '품명', field: 'item_name', width: 220 },
  { headerName: '입고수량', field: 'qty', width: 100 },
  {
    headerName: '단가',
    field: 'rate',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
  { headerName: '창고', field: 'warehouse', width: 140 },
]

const buildLineDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listPurchaseReceiptItems(selectedReceiptName.value, params.startRow, params.endRow - params.startRow)
      lineTotalCount.value = total
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

watch(selectedReceiptName, () => {
  refreshLineGrid()
})

const defaultColDef = { cellClass: ['d-flex', 'align-center'] }
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">입고관리</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-row class="align-end">
        <v-col cols="12" md="4">
          <v-text-field v-model="dateStart" type="date" label="입고일자(시작)" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="dateEnd" type="date" label="입고일자(종료)" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="입고번호 검색..." hide-details color="primary" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" class="d-flex align-center justify-space-between">
          <h3 class="text-h6 mb-2">
            입고마스터
            <span v-if="receiptTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ receiptTotalCount }}</span> 건
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
            :column-defs="receiptColumnDefs"
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
            @grid-ready="onReceiptGridReady"
            @selection-changed="onReceiptSelectionChanged"
            @cell-clicked="onReceiptCellClicked"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-h6 mb-2">
            입고상세
            <span v-if="lineTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ lineTotalCount }}</span> 건
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

  <PurchaseReceiptModifyPopup v-model="showModify" :name="editingName" @saved="onSaved" @error="notifyError" />
  <PurchaseReceiptRegisterPopup v-model="showRegister" @saved="onSaved" @error="notifyError" />

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
