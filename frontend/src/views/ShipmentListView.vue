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
  cancelShipment,
  deleteShipment,
  listShipmentItems,
  listShipments,
  submitShipment,
  DOCSTATUS_LABELS,
  type ShipmentItemListItem,
  type ShipmentListItem,
} from '@/api/shipment'
import { ApiError } from '@/api/client'
import ShipmentRowActions from '@/components/shipment/ShipmentRowActions.vue'
import ShipmentModifyPopup from '@/components/shipment/ShipmentModifyPopup.vue'
import ShipmentRegisterPopup from '@/components/shipment/ShipmentRegisterPopup.vue'

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

// 출고마스터 그리드
const shipmentGridApi = shallowRef<GridApi | null>(null)
const shipmentTotalCount = ref<number | undefined>(undefined)
const selectedShipmentName = ref('')

const showModify = ref(false)
const showRegister = ref(false)
const editingName = ref('')

const editShipment = (name: string) => {
  editingName.value = name
  showModify.value = true
}

const onSaved = () => {
  notifySuccess('저장되었습니다.')
  refreshShipmentGrid()
}

const submitShipmentRow = async (name: string) => {
  if (!window.confirm('이 출고를 확정하시겠습니까? 확정 시 거래처별 출고전표(Delivery Note)가 생성/제출됩니다.')) return
  try {
    await submitShipment(name)
    notifySuccess('확정되었습니다.')
    refreshShipmentGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '확정에 실패했습니다.')
  }
}

const cancelShipmentRow = async (name: string) => {
  if (!window.confirm('확정을 취소하시겠습니까? 연결된 출고전표도 함께 취소됩니다.')) return
  try {
    await cancelShipment(name)
    notifySuccess('확정이 취소되었습니다.')
    refreshShipmentGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '확정취소에 실패했습니다.')
  }
}

const deleteShipmentRow = async (name: string) => {
  if (!window.confirm('출고 정보를 삭제하시겠습니까?')) return
  try {
    await deleteShipment(name)
    notifySuccess('삭제되었습니다.')
    if (selectedShipmentName.value === name) selectedShipmentName.value = ''
    refreshShipmentGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
  }
}

const shipmentColumnDefs: ColDef<ShipmentListItem>[] = [
  { headerName: '출고번호', field: 'name', width: 160 },
  { headerName: '출고일자', field: 'shipment_date', width: 120 },
  {
    headerName: '상태',
    field: 'docstatus',
    width: 100,
    valueFormatter: (params: ValueFormatterParams) => DOCSTATUS_LABELS[params.value] ?? params.value,
  },
  { headerName: '차량번호', field: 'vehicle_no', width: 120 },
  { headerName: '차량구분', field: 'vehicle_type', width: 110 },
  {
    headerName: '운반비',
    field: 'freight_cost',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
  { headerName: '출하지', field: 'dispatch_location', width: 140 },
  { headerName: '총출고중량', field: 'total_ship_weight', width: 110 },
  {
    headerName: '실행',
    sortable: false,
    cellRenderer: ShipmentRowActions,
    cellRendererParams: { onEdit: editShipment, onSubmit: submitShipmentRow, onCancel: cancelShipmentRow, onDelete: deleteShipmentRow },
    width: 110,
  },
]

const buildShipmentDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listShipments(
        {
          search: searchQuery.value || undefined,
          dateStart: dateStart.value || undefined,
          dateEnd: dateEnd.value || undefined,
        },
        params.startRow,
        params.endRow - params.startRow,
      )
      shipmentTotalCount.value = total
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onShipmentGridReady = (event: GridReadyEvent) => {
  shipmentGridApi.value = event.api
  event.api.setGridOption('datasource', buildShipmentDatasource())
}

const refreshShipmentGrid = () => {
  shipmentGridApi.value?.setGridOption('datasource', buildShipmentDatasource())
}

const onShipmentSelectionChanged = (event: SelectionChangedEvent<ShipmentListItem>) => {
  const rows = event.api.getSelectedRows()
  selectedShipmentName.value = rows[0]?.name ?? ''
}

const onShipmentCellClicked = (event: CellClickedEvent<ShipmentListItem>) => {
  if (!event.colDef.field || !event.data) return
  editShipment(event.data.name)
}

let debounceHandle: number | undefined
watch([searchQuery, dateStart, dateEnd], () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(refreshShipmentGrid, 400)
})

// 출고상세 그리드 (읽기전용, 선택된 출고건의 라인)
const lineGridApi = shallowRef<GridApi | null>(null)
const lineTotalCount = ref<number | undefined>(undefined)

const lineColumnDefs: ColDef<ShipmentItemListItem>[] = [
  { headerName: '거래처', field: 'customer_name', width: 160 },
  { headerName: '품명', field: 'item_name', width: 200 },
  { headerName: '형번', field: 'mold_model', width: 120 },
  { headerName: '규격', field: 'spec', width: 100 },
  { headerName: '색상', field: 'color', width: 100 },
  { headerName: '재질', field: 'material', width: 100 },
  { headerName: '열처리방법', field: 'heat_treatment', width: 120 },
  { headerName: '출고수량', field: 'ship_qty', width: 100 },
  { headerName: '출고중량', field: 'ship_weight', width: 100 },
  { headerName: '출고전표', field: 'delivery_note', width: 160 },
]

const buildLineDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listShipmentItems(selectedShipmentName.value, params.startRow, params.endRow - params.startRow)
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

watch(selectedShipmentName, () => {
  refreshLineGrid()
})

const defaultColDef = { cellClass: ['d-flex', 'align-center'] }
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">출고관리</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-row class="align-end">
        <v-col cols="12" md="4">
          <v-text-field v-model="dateStart" type="date" label="출고일자(시작)" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="dateEnd" type="date" label="출고일자(종료)" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="출고번호 검색..." hide-details color="primary" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" class="d-flex align-center justify-space-between">
          <h3 class="text-h6 mb-2">
            출고마스터
            <span v-if="shipmentTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ shipmentTotalCount }}</span> 건
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
            :column-defs="shipmentColumnDefs"
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
            @grid-ready="onShipmentGridReady"
            @selection-changed="onShipmentSelectionChanged"
            @cell-clicked="onShipmentCellClicked"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-h6 mb-2">
            출고상세
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

  <ShipmentModifyPopup v-model="showModify" :name="editingName" @saved="onSaved" @error="notifyError" />
  <ShipmentRegisterPopup v-model="showRegister" @saved="onSaved" @error="notifyError" />

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
