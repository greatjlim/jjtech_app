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
} from 'ag-grid-community'
import {
  cancelWorkOrder,
  deleteWorkOrder,
  getWorkOrderFieldOptions,
  listWorkOrders,
  listWorkstations,
  submitWorkOrder,
  type WorkOrderListItem,
} from '@/api/workOrder'
import { ApiError } from '@/api/client'
import WorkOrderRowActions from '@/components/workOrder/WorkOrderRowActions.vue'
import WorkOrderModifyPopup from '@/components/workOrder/WorkOrderModifyPopup.vue'
import WorkOrderRegisterPopup from '@/components/workOrder/WorkOrderRegisterPopup.vue'

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
const workstation = ref('all')
const status = ref('all')
const searchQuery = ref('')

const workstationOptions = ref<string[]>([])
const statusOptions = ref<string[]>([])
const statusSelectItems = ref<{ title: string; value: string }[]>([{ title: '전체', value: 'all' }])

onMounted(async () => {
  ;[workstationOptions.value, statusOptions.value] = await Promise.all([
    listWorkstations(),
    getWorkOrderFieldOptions('status'),
  ])
  statusSelectItems.value = [{ title: '전체', value: 'all' }, ...statusOptions.value.map((opt) => ({ title: opt, value: opt }))]
})

const gridApi = shallowRef<GridApi | null>(null)
const totalCount = ref<number | undefined>(undefined)

const showModify = ref(false)
const showRegister = ref(false)
const editingName = ref('')

const editWorkOrder = (name: string) => {
  editingName.value = name
  showModify.value = true
}

// "실행" 컬럼(field 없음)을 클릭했을 때는 그 안의 버튼이 처리하므로 팝업을 띄우지 않는다.
const onGridCellClicked = (event: CellClickedEvent<WorkOrderListItem>) => {
  if (!event.colDef.field || !event.data) return
  editWorkOrder(event.data.name)
}

const onSaved = () => {
  notifySuccess('저장되었습니다.')
  refresh()
}

const submitOrder = async (name: string) => {
  if (!window.confirm('생산지시를 내리시겠습니까? 제출 후에는 수정할 수 없습니다.')) return
  try {
    await submitWorkOrder(name)
    notifySuccess('생산지시가 내려졌습니다.')
    refresh()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '제출에 실패했습니다.')
  }
}

const cancelOrder = async (name: string) => {
  if (!window.confirm('제출을 취소하시겠습니까?')) return
  try {
    await cancelWorkOrder(name)
    notifySuccess('제출이 취소되었습니다.')
    refresh()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '제출취소에 실패했습니다.')
  }
}

const deleteOrder = async (name: string) => {
  if (!window.confirm('작업지시를 삭제하시겠습니까?')) return
  try {
    await deleteWorkOrder(name)
    notifySuccess('삭제되었습니다.')
    refresh()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
  }
}

const columnDefs: ColDef<WorkOrderListItem>[] = [
  { headerName: '작업지시번호', field: 'name', width: 160 },
  { headerName: '수주번호', field: 'sales_order', width: 160 },
  { headerName: '품목', field: 'item_name', width: 200 },
  { headerName: '수량', field: 'qty', width: 100 },
  { headerName: '호기', field: 'custom_workstation', width: 100 },
  { headerName: '금형', field: 'custom_mold', width: 140 },
  { headerName: '작업예정일', field: 'planned_start_date', width: 130 },
  { headerName: '납기', field: 'expected_delivery_date', width: 130 },
  { headerName: '상태', field: 'status', width: 140 },
  {
    headerName: '실행',
    sortable: false,
    cellRenderer: WorkOrderRowActions,
    cellRendererParams: { onEdit: editWorkOrder, onSubmit: submitOrder, onCancel: cancelOrder, onDelete: deleteOrder },
    width: 130,
  },
]

const buildDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listWorkOrders(
        {
          search: searchQuery.value || undefined,
          workstation: workstation.value === 'all' ? undefined : workstation.value,
          status: status.value === 'all' ? undefined : status.value,
        },
        params.startRow,
        params.endRow - params.startRow,
      )
      totalCount.value = total
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onGridReady = (event: GridReadyEvent) => {
  gridApi.value = event.api
  event.api.setGridOption('datasource', buildDatasource())
}

const refresh = () => {
  gridApi.value?.setGridOption('datasource', buildDatasource())
}

let debounceHandle: number | undefined
watch([workstation, status, searchQuery], () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(refresh, 400)
})

const insert = () => {
  showRegister.value = true
}

const defaultColDef = { cellClass: ['d-flex', 'align-center'] }
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">작업지시</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-row class="align-end">
        <v-col cols="12" md="6" lg="3">
          <v-radio-group v-model="workstation" inline hide-details label="호기">
            <v-radio label="전체" color="primary" value="all" />
            <v-radio v-for="opt in workstationOptions" :key="opt" :label="opt" color="primary" :value="opt" />
          </v-radio-group>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-select v-model="status" :items="statusSelectItems" item-title="title" item-value="value" label="상태" density="comfortable" variant="outlined" />
        </v-col>
        <v-col cols="12" lg="6">
          <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="품목 검색..." hide-details color="primary" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" class="d-flex align-center justify-space-between">
          <h3 class="text-h6 mb-2">
            작업지시 목록
            <span v-if="totalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ totalCount }}</span> 건
            </span>
          </h3>
          <v-tooltip location="top" text="등록하기">
            <template #activator="{ props: tooltipProps }">
              <v-avatar size="35">
                <v-btn v-bind="tooltipProps" class="rounded-circle" color="primary" flat @click="insert">
                  <v-icon color="white">mdi-plus-circle</v-icon>
                </v-btn>
              </v-avatar>
            </template>
          </v-tooltip>
        </v-col>
        <v-col cols="12">
          <ag-grid-vue
            :column-defs="columnDefs"
            :default-col-def="defaultColDef"
            row-model-type="infinite"
            :cache-block-size="100"
            :cache-overflow-size="1"
            :max-concurrent-datasource-requests="2"
            :infinite-initial-row-count="1"
            :max-blocks-in-cache="2"
            :theme="themeQuartz"
            :row-height="42"
            style="height: 500px; width: 100%"
            suppress-drag-leave-hides-columns
            @grid-ready="onGridReady"
            @cell-clicked="onGridCellClicked"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <WorkOrderModifyPopup v-model="showModify" :name="editingName" @saved="onSaved" @error="notifyError" />
  <WorkOrderRegisterPopup v-model="showRegister" @saved="onSaved" @error="notifyError" />

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
