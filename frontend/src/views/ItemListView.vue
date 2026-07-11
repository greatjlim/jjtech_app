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
  type ValueFormatterParams,
} from 'ag-grid-community'
import { deleteItem, listItems, type ItemManagementListItem } from '@/api/item'
import { ApiError } from '@/api/client'
import ItemRowActions from '@/components/item/ItemRowActions.vue'
import ItemModifyPopup from '@/components/item/ItemModifyPopup.vue'
import ItemRegisterPopup from '@/components/item/ItemRegisterPopup.vue'

ModuleRegistry.registerModules([AllCommunityModule])

const search = ref('')
const useOrNot = ref<'all' | 'Y' | 'N'>('all')
const totalCount = ref<number | undefined>(undefined)
const gridApi = shallowRef<GridApi | null>(null)

const showModify = ref(false)
const showRegister = ref(false)
const selectedName = ref('')

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

const onSaved = () => {
  notifySuccess('저장되었습니다.')
  refresh()
}

const edit = (name: string) => {
  selectedName.value = name
  showModify.value = true
}

const remove = async (name: string) => {
  if (!window.confirm('물품 정보를 삭제하시겠습니까?')) return
  try {
    await deleteItem(name)
    notifySuccess('삭제되었습니다.')
    refresh()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
  }
}

const onCellClicked = (event: CellClickedEvent<ItemManagementListItem>) => {
  if (!event.colDef.field || !event.data) return
  edit(event.data.name)
}

const columnDefs: ColDef<ItemManagementListItem>[] = [
  { headerName: '품목번호', field: 'name', width: 140 },
  { headerName: '품목명', field: 'item_name', width: 200 },
  { headerName: '분류', field: 'item_group', width: 140 },
  { headerName: '재고단위', field: 'stock_uom', width: 100 },
  {
    headerName: '매입가',
    field: 'custom_purchase_price',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
  {
    headerName: '판매가',
    field: 'standard_rate',
    width: 110,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
  {
    headerName: '부가세',
    field: 'custom_vat',
    width: 100,
    valueFormatter: (params: ValueFormatterParams) => (params.value != null ? Number(params.value).toLocaleString() : ''),
  },
  { headerName: '등록일자', field: 'custom_register_date', width: 120 },
  { headerName: '비고', field: 'description', flex: 1 },
  {
    headerName: '사용여부',
    field: 'disabled',
    width: 100,
    valueFormatter: (params: ValueFormatterParams) => (params.value ? '미사용' : '사용'),
  },
  {
    headerName: '실행',
    sortable: false,
    cellRenderer: ItemRowActions,
    cellRendererParams: { onEdit: edit, onDelete: remove },
    width: 100,
  },
]

const defaultColDef = { cellClass: ['d-flex', 'align-center'] }

const buildDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listItems(
        { search: search.value || undefined, useOrNot: useOrNot.value },
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
watch([search, useOrNot], () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(refresh, 400)
})

const insert = () => {
  showRegister.value = true
}
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">물품관리</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-row class="align-end">
        <v-col cols="12" md="6" lg="4">
          <v-radio-group v-model="useOrNot" inline hide-details label="사용여부">
            <v-radio label="전체" color="primary" value="all" />
            <v-radio label="사용" color="primary" value="Y" />
            <v-radio label="미사용" color="primary" value="N" />
          </v-radio-group>
        </v-col>
        <v-col cols="12" lg="8">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="품목명 검색..." hide-details color="primary" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" class="d-flex align-center justify-space-between">
          <h3 class="text-h6 mb-2">
            물품 목록
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
            @cell-clicked="onCellClicked"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <ItemModifyPopup v-model="showModify" :name="selectedName" @saved="onSaved" @error="notifyError" />
  <ItemRegisterPopup v-model="showRegister" @saved="onSaved" @error="notifyError" />

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>
