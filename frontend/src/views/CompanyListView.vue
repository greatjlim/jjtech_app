<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { listCompanies, type CompanyListItem } from '@/api/company'

const router = useRouter()
const search = ref('')
const loading = ref(false)
const items = ref<CompanyListItem[]>([])

const headers = [
  { title: '회사명', key: 'company_name' },
  { title: '약어', key: 'abbr' },
  { title: '사업자등록번호', key: 'tax_id' },
  { title: '전화번호', key: 'phone_no' },
  { title: '국가', key: 'country' },
]

const load = async () => {
  loading.value = true
  try {
    items.value = await listCompanies(search.value)
  } finally {
    loading.value = false
  }
}

let debounceHandle: number | undefined
watch(search, () => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(load, 400)
})

onMounted(load)

const openDetail = (name: string) => {
  router.push(`/companies/${encodeURIComponent(name)}`)
}
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">회사 관리</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="검색..."
        hide-details
        density="comfortable"
        style="max-width: 360px"
        class="mb-4"
      />
      <v-data-table :headers="headers" :items="items" :loading="loading" item-value="name">
        <template #item.company_name="{ item }">
          <a
            href="#"
            class="text-primary font-weight-medium text-decoration-none"
            @click.prevent="openDetail(item.name)"
          >
            {{ item.company_name }}
          </a>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>
