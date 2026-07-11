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
  listStockLedger,
  listStockStatus,
  listWarehouses,
  VOUCHER_TYPE_LABELS,
  type StockLedgerEntryItem,
  type StockStatusItem,
  type WarehouseOption,
} from '@/api/stock'

ModuleRegistry.registerModules([AllCommunityModule])

// 조회조건
const searchQuery = ref('')
const warehouseFilter = ref('')
const onlyInStock = ref(true)
const warehouseOptions = ref<WarehouseOption[]>([])

onMounted(async () => {
  warehouseOptions.value = await listWarehouses()
})

// 재고현황 그리드
const statusGridApi = shallowRef<GridApi | null>(null)
const statusTotalCount = ref<number | undefined>(undefined)
const selectedItemCode = ref('')
const selectedWarehouse = ref('')

const statusColumnDefs: ColDef<StockStatusItem>[] = [
  { headerName: '품목코드', field: 'item_code', width: 140 },
  { headerName: '품목명', field: 'item_name', width: 200 },
  { headerName: '창고', field: 'warehouse', width: 160 },
  { headerName: '실재고', field: 'actual_qty', width: 100 },
  { headerName: '예약재고', field: 'reserved_qty', width: 100 },
  { headerName: '가용재고', field: 'projected_qty', width: 100 },
  {
    headerName: '평가단가',
    field: 'valuation_rate',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
  {
    headerName: '재고금액',
    field: 'stock_value',
    width: 130,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
]

const buildStatusDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listStockStatus(
        {
          search: searchQuery.value || undefined,
          warehouse: warehouseFilter.value || undefined,
          onlyInStock: onlyInStock.value,
        },
        params.startRow,
        params.endRow - params.startRow,
      )
      statusTotalCount.value = total
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onStatusGridReady = (event: GridReadyEvent) => {
  statusGridApi.value = event.api
  event.api.setGridOption('datasource', buildStatusDatasource())
}

const refreshStatusGrid = () => {
  statusGridApi.value?.setGridOption('datasource', buildStatusDatasource())
}

const onStatusSelectionChanged = (event: SelectionChangedEvent<StockStatusItem>) => {
  const row = event.api.getSelectedRows()[0]
  selectedItemCode.value = row?.item_code ?? ''
  selectedWarehouse.value = row?.warehouse ?? ''
}

const onStatusCellClicked = (event: CellClickedEvent<StockStatusItem>) => {
  if (!event.data) return
  selectedItemCode.value = event.data.item_code
  selectedWarehouse.value = event.data.warehouse
}

let debounceHandle: number | undefined
watch([searchQuery, warehouseFilter, onlyInStock], () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(refreshStatusGrid, 400)
})

// 재고이력 그리드 (읽기전용, 선택된 품목×창고의 Stock Ledger Entry)
const ledgerGridApi = shallowRef<GridApi | null>(null)
const ledgerTotalCount = ref<number | undefined>(undefined)

const ledgerColumnDefs: ColDef<StockLedgerEntryItem>[] = [
  { headerName: '일자', field: 'posting_date', width: 110 },
  { headerName: '시각', field: 'posting_time', width: 100 },
  {
    headerName: '구분',
    field: 'voucher_type',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => VOUCHER_TYPE_LABELS[params.value] ?? params.value,
  },
  { headerName: '참조문서', field: 'voucher_no', width: 160 },
  { headerName: '변동수량', field: 'actual_qty', width: 100 },
  { headerName: '변동후재고', field: 'qty_after_transaction', width: 110 },
  {
    headerName: '입고단가',
    field: 'incoming_rate',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
  {
    headerName: '평가단가',
    field: 'valuation_rate',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
]

const buildLedgerDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listStockLedger(
        selectedItemCode.value,
        selectedWarehouse.value,
        params.startRow,
        params.endRow - params.startRow,
      )
      ledgerTotalCount.value = total
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onLedgerGridReady = (event: GridReadyEvent) => {
  ledgerGridApi.value = event.api
  event.api.setGridOption('datasource', buildLedgerDatasource())
}

const refreshLedgerGrid = () => {
  ledgerGridApi.value?.setGridOption('datasource', buildLedgerDatasource())
}

watch([selectedItemCode, selectedWarehouse], () => {
  refreshLedgerGrid()
})

const defaultColDef = { cellClass: ['d-flex', 'align-center'] }
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">재고관리</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-row class="align-end">
        <v-col cols="12" md="4">
          <v-select
            v-model="warehouseFilter"
            :items="[{ name: '' }, ...warehouseOptions]"
            item-title="name"
            item-value="name"
            label="창고"
            variant="outlined"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-checkbox v-model="onlyInStock" label="재고있음만" hide-details density="comfortable" color="primary" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="품목/창고 검색..." hide-details color="primary" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-h6 mb-2">
            재고현황
            <span v-if="statusTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ statusTotalCount }}</span> 건
            </span>
          </h3>
          <ag-grid-vue
            :column-defs="statusColumnDefs"
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
            @grid-ready="onStatusGridReady"
            @selection-changed="onStatusSelectionChanged"
            @cell-clicked="onStatusCellClicked"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-h6 mb-2">
            재고이력
            <span v-if="ledgerTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ ledgerTotalCount }}</span> 건
            </span>
          </h3>
          <ag-grid-vue
            :column-defs="ledgerColumnDefs"
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
            @grid-ready="onLedgerGridReady"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
