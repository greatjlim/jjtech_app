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
import { deleteMoldModel, getMoldModelFieldOptions, listMoldModels, type MoldModelListItem } from '@/api/moldModel'
import { deleteMold, listMolds, type MoldListItem } from '@/api/mold'
import { ApiError } from '@/api/client'
import MoldModelRowActions from '@/components/moldModel/MoldModelRowActions.vue'
import MoldModelModifyPopup from '@/components/moldModel/MoldModelModifyPopup.vue'
import MoldModelRegisterPopup from '@/components/moldModel/MoldModelRegisterPopup.vue'
import MoldRowActions from '@/components/mold/MoldRowActions.vue'
import MoldModifyPopup from '@/components/mold/MoldModifyPopup.vue'
import MoldRegisterPopup from '@/components/mold/MoldRegisterPopup.vue'

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

const showModelModify = ref(false)
const showModelRegister = ref(false)
const editingModelNumber = ref('')

const editModel = (modelNumber: string) => {
  editingModelNumber.value = modelNumber
  showModelModify.value = true
}

const deleteModel = async (modelNumber: string) => {
  if (!window.confirm('형번마스터 정보를 삭제하시겠습니까?')) return
  try {
    await deleteMoldModel(modelNumber)
    notifySuccess('삭제되었습니다.')
    if (selectedModelNumber.value === modelNumber) selectedModelNumber.value = ''
    refreshModelGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
  }
}

const onModelSaved = () => {
  notifySuccess('저장되었습니다.')
  refreshModelGrid()
}

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
  {
    headerName: '실행',
    sortable: false,
    cellRenderer: MoldModelRowActions,
    cellRendererParams: { onEdit: editModel, onDelete: deleteModel },
    width: 100,
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

// 금형 그리드
const moldGridApi = shallowRef<GridApi | null>(null)
const moldTotalCount = ref<number | undefined>(undefined)

const showMoldModify = ref(false)
const showMoldRegister = ref(false)
const editingMoldName = ref('')

const editMold = (name: string) => {
  editingMoldName.value = name
  showMoldModify.value = true
}

const deleteMoldRow = async (name: string) => {
  if (!window.confirm('금형 정보를 삭제하시겠습니까?')) return
  try {
    await deleteMold(name)
    notifySuccess('삭제되었습니다.')
    refreshMoldGrid()
  } catch (e) {
    notifyError(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
  }
}

const onMoldSaved = () => {
  notifySuccess('저장되었습니다.')
  refreshMoldGrid()
}

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
  {
    headerName: '실행',
    sortable: false,
    cellRenderer: MoldRowActions,
    cellRendererParams: { onEdit: editMold, onDelete: deleteMoldRow },
    width: 100,
  },
]

const buildMoldDatasource = (): IDatasource => ({
  rowCount: undefined,
  getRows: async (params: IGetRowsParams) => {
    try {
      const { items, total } = await listMolds(selectedModelNumber.value, params.startRow, params.endRow - params.startRow)
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

const refreshMoldGrid = () => {
  moldGridApi.value?.setGridOption('datasource', buildMoldDatasource())
}

watch(selectedModelNumber, () => {
  refreshMoldGrid()
})

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
        <v-col cols="12" class="d-flex align-center justify-space-between">
          <h3 class="text-h6 mb-2">
            형번마스터
            <span v-if="modelTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ modelTotalCount }}</span> 건
            </span>
          </h3>
          <v-tooltip location="top" text="등록하기">
            <template #activator="{ props: tooltipProps }">
              <v-avatar size="35">
                <v-btn v-bind="tooltipProps" class="rounded-circle" color="primary" flat @click="showModelRegister = true">
                  <v-icon color="white">mdi-plus-circle</v-icon>
                </v-btn>
              </v-avatar>
            </template>
          </v-tooltip>
        </v-col>
        <v-col cols="12">
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
        <v-col cols="12" class="d-flex align-center justify-space-between">
          <h3 class="text-h6 mb-2">
            금형
            <span v-if="moldTotalCount != null" class="text-body-2 text-medium-emphasis ml-2">
              총 <span class="text-error font-weight-bold">{{ moldTotalCount }}</span> 건
            </span>
          </h3>
          <v-tooltip location="top" text="등록하기">
            <template #activator="{ props: tooltipProps }">
              <v-avatar size="35">
                <v-btn
                  v-bind="tooltipProps"
                  class="rounded-circle"
                  color="primary"
                  flat
                  :disabled="!selectedModelNumber"
                  @click="showMoldRegister = true"
                >
                  <v-icon color="white">mdi-plus-circle</v-icon>
                </v-btn>
              </v-avatar>
            </template>
          </v-tooltip>
        </v-col>
        <v-col cols="12">
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

  <MoldModelModifyPopup v-model="showModelModify" :model-number="editingModelNumber" @saved="onModelSaved" @error="notifyError" />
  <MoldModelRegisterPopup v-model="showModelRegister" @saved="onModelSaved" @error="notifyError" />
  <MoldModifyPopup v-model="showMoldModify" :name="editingMoldName" @saved="onMoldSaved" @error="notifyError" />
  <MoldRegisterPopup
    v-model="showMoldRegister"
    :mold-model="selectedModelNumber"
    @saved="onMoldSaved"
    @error="notifyError"
  />

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
    {{ snackbarText }}
  </v-snackbar>
</template>
