<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue'
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
  type SelectionChangedEvent,
  type ValueFormatterParams,
} from 'ag-grid-community'
import { getMoldModelFieldOptions, listMoldModels, type MoldModelListItem } from '@/api/moldModel'
import { listMolds, type MoldListItem } from '@/api/mold'

ModuleRegistry.registerModules([AllCommunityModule])

// 조회조건
const partnerType = ref('all')
const useOrNot = ref('all')
const searchQuery = ref('')
const showAdvanced = ref(false)
const selectedPurposes = ref<string[]>([])
const selectedOrderTypes = ref<string[]>([])
const registerStartDate = ref('')
const registerEndDate = ref('')

const partnerTypeOptions = ref<string[]>([])
const purposeOptions = ref<string[]>([])
const orderTypeOptions = ref<string[]>([])

onMounted(async () => {
  ;[partnerTypeOptions.value, purposeOptions.value, orderTypeOptions.value] = await Promise.all([
    getMoldModelFieldOptions('partner_type'),
    getMoldModelFieldOptions('purpose'),
    getMoldModelFieldOptions('order_type'),
  ])
})

// 형번마스터 그리드
const modelGridApi = shallowRef<GridApi | null>(null)
const modelTotalCount = ref<number | undefined>(undefined)
const selectedModelNumber = ref('')

const modelColumnDefs: ColDef<MoldModelListItem>[] = [
  { headerName: '형번', field: 'model_number', width: 120 },
  { headerName: '유형구분', field: 'order_type', width: 110 },
  { headerName: '수주처', field: 'vendor', width: 160 },
  { headerName: '수주처형번', field: 'vendor_model_number', width: 140 },
  { headerName: 'TYPE', field: 'mold_type', width: 100 },
  { headerName: '재질/열처리', field: 'texture_heat_treatment', width: 140 },
  { headerName: '용도', field: 'purpose', width: 110 },
  { headerName: '단중', field: 'unit_weight', width: 100 },
  { headerName: '품질유의사항', field: 'quality_precaution', width: 160 },
  { headerName: '작성일자', field: 'creation_date', width: 120 },
  { headerName: '폐기일자', field: 'disposal_date', width: 120 },
  {
    headerName: '사용여부',
    field: 'use_or_not',
    width: 100,
    valueFormatter: (params: ValueFormatterParams) => (params.value ? '사용' : '미사용'),
  },
]

const buildModelDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listMoldModels(
        {
          search: searchQuery.value || undefined,
          partnerType: partnerType.value === 'all' ? undefined : partnerType.value,
          useOrNot: useOrNot.value === 'all' ? undefined : (useOrNot.value as 'Y' | 'N'),
          purposes: showAdvanced.value ? selectedPurposes.value : undefined,
          orderTypes: showAdvanced.value ? selectedOrderTypes.value : undefined,
          registerStartDate: showAdvanced.value ? registerStartDate.value || undefined : undefined,
          registerEndDate: showAdvanced.value ? registerEndDate.value || undefined : undefined,
        },
        params.startRow,
        params.endRow - params.startRow,
      )
      modelTotalCount.value = total
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onModelGridReady = (event: GridReadyEvent) => {
  modelGridApi.value = event.api
  event.api.setGridOption('datasource', buildModelDatasource())
}

const refreshModelGrid = () => {
  modelGridApi.value?.setGridOption('datasource', buildModelDatasource())
}

const onModelSelectionChanged = (event: SelectionChangedEvent<MoldModelListItem>) => {
  const rows = event.api.getSelectedRows()
  selectedModelNumber.value = rows[0]?.model_number ?? ''
}

let debounceHandle: number | undefined
watch([partnerType, useOrNot, searchQuery, selectedPurposes, selectedOrderTypes, registerStartDate, registerEndDate], () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(refreshModelGrid, 400)
}, { deep: true })

// 금형 그리드 (형번 선택 연동은 다음 단계에서 진행 — 지금은 항상 빈 목록)
const moldGridApi = shallowRef<GridApi | null>(null)
const moldTotalCount = ref<number | undefined>(undefined)

const moldColumnDefs: ColDef<MoldListItem>[] = [
  { headerName: '금형번호', field: 'mold_number', width: 140 },
  { headerName: '제작업체', field: 'manufacturer', width: 160 },
  { headerName: 'B구경', field: 'b_diameter', width: 100 },
  { headerName: '압출비', field: 'extrusion_rate', width: 100 },
  { headerName: 'Hole수', field: 'hole_count', width: 100 },
  { headerName: '다이', field: 'diameter', width: 100 },
  { headerName: '칫수', field: 'dimension', width: 100 },
  { headerName: '현재상태', field: 'current_status', width: 110 },
  { headerName: '제작사유', field: 'production_reason', width: 120 },
  { headerName: '제작처입고일', field: 'production_receipt_date', width: 140 },
  { headerName: '폐기일', field: 'disposal_date', width: 120 },
  { headerName: '폐기사유', field: 'disposal_reason', width: 140 },
]

const buildMoldDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listMolds('', params.startRow, params.endRow - params.startRow)
      moldTotalCount.value = total
      const endRow = total <= params.endRow ? total : -1
      params.successCallback(items, endRow)
    } catch {
      params.successCallback([], 0)
    }
  },
})

const onMoldGridReady = (event: GridReadyEvent) => {
  moldGridApi.value = event.api
  event.api.setGridOption('datasource', buildMoldDatasource())
}

const defaultColDef = { cellClass: ['d-flex', 'align-center'] }
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">금형관리</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-row class="align-end">
        <v-col cols="12" md="6" lg="3">
          <v-radio-group v-model="partnerType" inline hide-details label="파트너구분">
            <v-radio label="전체" color="primary" value="all" />
            <v-radio v-for="opt in partnerTypeOptions" :key="opt" :label="opt" color="primary" :value="opt" />
          </v-radio-group>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-radio-group v-model="useOrNot" inline hide-details label="사용여부">
            <v-radio label="전체" color="primary" value="all" />
            <v-radio label="사용" color="primary" value="Y" />
            <v-radio label="미사용" color="primary" value="N" />
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
          <v-autocomplete
            v-model="selectedPurposes"
            :items="purposeOptions"
            label="용도구분"
            multiple
            closable-chips
            chips
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-autocomplete
            v-model="selectedOrderTypes"
            :items="orderTypeOptions"
            label="금형유형"
            multiple
            closable-chips
            chips
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-text-field v-model="registerStartDate" type="date" label="등록일자(시작)" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-text-field v-model="registerEndDate" type="date" label="등록일자(종료)" variant="outlined" density="comfortable" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-h6 mb-2">
            형번마스터
            <span v-if="modelTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ modelTotalCount }}</span> 건
            </span>
          </h3>
          <ag-grid-vue
            :column-defs="modelColumnDefs"
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
            @grid-ready="onModelGridReady"
            @selection-changed="onModelSelectionChanged"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h3 class="text-h6 mb-2">
            금형
            <span v-if="moldTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ moldTotalCount }}</span> 건
            </span>
          </h3>
          <ag-grid-vue
            :column-defs="moldColumnDefs"
            :default-col-def="defaultColDef"
            row-model-type="infinite"
            :cache-block-size="100"
            :cache-overflow-size="1"
            :max-concurrent-datasource-requests="2"
            :infinite-initial-row-count="1"
            :max-blocks-in-cache="2"
            :theme="themeQuartz"
            :row-height="42"
            style="height: 400px; width: 100%"
            suppress-drag-leave-hides-columns
            @grid-ready="onMoldGridReady"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
