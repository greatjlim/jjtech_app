<script setup lang="ts" generic="T extends object">
import { onMounted, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'

const props = withDefaults(
  defineProps<{
    dialogTitle: string
    searchFn: (search: string) => Promise<T[]>
    resolveFn?: (id: string) => Promise<T | null>
    columns: { key: string; title: string }[]
    itemValue: string
    itemLabel: string
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    resolveFn: undefined,
    disabled: false,
    clearable: false,
    placeholder: '선택...',
  },
)

const emit = defineEmits<{ select: [row: T]; clear: [] }>()

// v-model(id) + v-model:display-text(라벨)을 같이 받는다. 라벨은 호출부가
// select 시점에 직접 채워도 되고, 이 컴포넌트가 resolveFn으로 채워도 된다
// (수정 화면 진입처럼 id만 있고 라벨을 모르는 경우).
const modelValue = defineModel<string>({ default: '' })
const displayText = defineModel<string>('displayText', { default: '' })

const show = ref(false)
const search = ref('')
const results = ref<T[]>([])
const loading = ref(false)

function field(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

const runSearch = async () => {
  loading.value = true
  try {
    results.value = await props.searchFn(search.value)
  } finally {
    loading.value = false
  }
}

const open = () => {
  if (props.disabled) return
  search.value = ''
  show.value = true
  runSearch()
}

// 팝업(FormDialog)은 닫혔다 다시 열려도 컴포넌트 인스턴스가 유지되는 경우가 많아서,
// resolveFn을 마운트 시점에만 돌리면 두 번째 오픈부터는 라벨이 안 바뀐다. 그래서
// modelValue 변화를 계속 지켜보다가, "이 컴포넌트 스스로 pick/clear해서 바뀐 값"이면
// 이미 displayText도 같이 맞춰놨으니 건너뛰고, "부모가 form을 통째로 갈아끼워서 바뀐
// 값"(등록/수정 팝업 재사용, 편집화면 진입 등)이면 resolveFn으로 다시 채운다.
let internalChange = false

const resolveLabel = async (id: string) => {
  if (!id) {
    displayText.value = ''
    return
  }
  if (!props.resolveFn) return
  const row = await props.resolveFn(id)
  displayText.value = row ? String(field(row, props.itemLabel)) : id
}

watch(modelValue, (id) => {
  if (internalChange) {
    internalChange = false
    return
  }
  resolveLabel(id)
})

const pick = (row: T) => {
  internalChange = true
  modelValue.value = String(field(row, props.itemValue))
  displayText.value = String(field(row, props.itemLabel))
  emit('select', row)
  show.value = false
}

const clearValue = () => {
  internalChange = true
  modelValue.value = ''
  displayText.value = ''
  emit('clear')
}

onMounted(() => {
  if (modelValue.value) resolveLabel(modelValue.value)
})
</script>

<template>
  <v-text-field
    :model-value="displayText"
    readonly
    variant="outlined"
    density="comfortable"
    :disabled="disabled"
    :placeholder="placeholder"
    append-inner-icon="mdi-magnify"
    @click="open"
    @click:append-inner="open"
  >
    <template v-if="clearable && modelValue" #append>
      <v-btn icon size="small" variant="text" :disabled="disabled" @click.stop="clearValue">
        <v-icon size="18">mdi-close</v-icon>
      </v-btn>
    </template>
  </v-text-field>

  <FormDialog v-model="show" :title="dialogTitle" hide-save>
    <div class="d-flex align-center mb-2" style="gap: 8px">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="검색..."
        hide-details
        density="comfortable"
        @keyup.enter="runSearch"
      />
      <v-btn color="primary" variant="tonal" :loading="loading" @click="runSearch">검색</v-btn>
    </div>
    <v-table density="comfortable" height="360" fixed-header>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.title }}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in results" :key="String(field(row, itemValue))">
          <td v-for="col in columns" :key="col.key">{{ field(row, col.key) }}</td>
          <td>
            <v-btn size="small" color="primary" variant="text" @click="pick(row)">선택</v-btn>
          </td>
        </tr>
        <tr v-if="results.length === 0">
          <td :colspan="columns.length + 1" class="text-center text-medium-emphasis">검색 결과가 없습니다</td>
        </tr>
      </tbody>
    </v-table>
  </FormDialog>
</template>
