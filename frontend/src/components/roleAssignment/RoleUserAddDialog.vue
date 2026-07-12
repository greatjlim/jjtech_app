<script setup lang="ts">
import { ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import { listAssignableUsers, type AssignableUser } from '@/api/user'

const props = defineProps<{
  role: string
}>()
const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{ add: [user: AssignableUser] }>()

const search = ref('')
const results = ref<AssignableUser[]>([])
const loading = ref(false)

const runSearch = async () => {
  if (!props.role) return
  loading.value = true
  try {
    results.value = await listAssignableUsers(props.role, search.value || undefined)
  } finally {
    loading.value = false
  }
}

watch(show, (newShow) => {
  if (newShow) {
    search.value = ''
    runSearch()
  }
})

const addRow = (row: AssignableUser) => {
  emit('add', row)
  show.value = false
}
</script>

<template>
  <FormDialog v-model="show" title="역할에 사용자 추가" hide-save>
    <div class="d-flex align-center mb-2" style="gap: 8px">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="이름/이메일 검색..."
        hide-details
        density="comfortable"
        @keyup.enter="runSearch"
      />
      <v-btn color="primary" variant="tonal" :loading="loading" @click="runSearch">검색</v-btn>
    </div>
    <v-table density="comfortable" height="360" fixed-header>
      <thead>
        <tr>
          <th>이름</th>
          <th>이메일</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in results" :key="row.name">
          <td>{{ row.full_name }}</td>
          <td>{{ row.name }}</td>
          <td>
            <v-btn size="small" color="primary" variant="text" @click="addRow(row)">추가</v-btn>
          </td>
        </tr>
        <tr v-if="results.length === 0">
          <td colspan="3" class="text-center text-medium-emphasis">추가할 수 있는 사용자가 없습니다</td>
        </tr>
      </tbody>
    </v-table>
  </FormDialog>
</template>
