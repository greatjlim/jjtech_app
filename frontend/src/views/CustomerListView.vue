<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type IDatasource,
  type IGetRowsParams,
  type RowDoubleClickedEvent,
} from 'ag-grid-community'
import { listCustomers, type CustomerListItem } from '@/api/customer'
import CustomerRowActions from '@/components/customer/CustomerRowActions.vue'
import CustomerModifyPopup from '@/components/customer/CustomerModifyPopup.vue'

ModuleRegistry.registerModules([AllCommunityModule])

const search = ref('')
const totalCount = ref<number | undefined>(undefined)
const gridApi = shallowRef<GridApi | null>(null)

const showModify = ref(false)
const selectedName = ref('')

const edit = (name: string) => {
  selectedName.value = name
  showModify.value = true
}

const remove = (_name: string) => {
  // 삭제는 이후 단계에서 연결
}

const onRowDoubleClicked = (event: RowDoubleClickedEvent<CustomerListItem>) => {
  if (event.data) edit(event.data.name)
}

const columnDefs: ColDef<CustomerListItem>[] = [
  { headerName: '거래처명', field: 'customer_name', width: 220 },
  { headerName: '대표자명', field: 'custom_representative_name', width: 140 },
  { headerName: '사업자등록번호', field: 'tax_id', width: 160 },
  { headerName: '전화번호', field: 'custom_phone_number', width: 160 },
  { headerName: '주소', field: 'custom_address_main', flex: 1 },
  {
    headerName: '실행',
    sortable: false,
    cellRenderer: CustomerRowActions,
    cellRendererParams: { onEdit: edit, onDelete: remove },
    width: 100,
  },
]

const defaultColDef = { cellClass: ['d-flex', 'align-center'] }

const buildDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listCustomers(search.value, params.startRow, params.endRow - params.startRow)
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
watch(search, () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(refresh, 400)
})

const insert = () => {
  // 신규입력 팝업은 이후 단계에서 연결
}
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">거래처 관리</h1>
  <v-row>
    <v-col cols="12" sm="8" class="text-left title">
      <h4 v-if="totalCount != null" class="total-count">
        총 <span class="text-error ms-1 count">{{ totalCount }}</span> 건
      </h4>
    </v-col>
    <v-col cols="12" sm="4" class="text-right">
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
  </v-row>
  <v-text-field
    v-model="search"
    prepend-inner-icon="mdi-magnify"
    label="검색..."
    hide-details
    color="primary"
    class="mt-4 mb-2"
  />
  <ag-grid-vue
    class="mt-2"
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
    @row-double-clicked="onRowDoubleClicked"
  />

  <CustomerModifyPopup v-model="showModify" :name="selectedName" />
</template>

<style scoped>
.total-count {
  margin-left: 20px;
}
.count {
  font-weight: bold;
}
</style>
