<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listWorkstations } from '@/api/workOrder'

const router = useRouter()
const workstations = ref<string[]>([])

onMounted(async () => {
  workstations.value = await listWorkstations()
})

const goTo = (workstation: string, path: string) => {
  router.push(`/kiosk/${encodeURIComponent(workstation)}/${path}`)
}

const MENU = [
  { path: 'preheat', label: '금형예열', icon: 'mdi-fire' },
  { path: 'preheat', label: '압출작업지시', icon: 'mdi-arrow-down-bold-box' },
  { path: 'cutting', label: '절단작업', icon: 'mdi-content-cut' },
  { path: 'packaging', label: '포장등록', icon: 'mdi-package-variant-closed' },
]
</script>

<template>
  <v-row justify="center" class="mt-2">
    <v-col v-for="ws in workstations" :key="ws" cols="12" sm="6" md="4" lg="3">
      <div class="text-h5 font-weight-bold text-center py-3 mb-4 rounded" style="background: linear-gradient(to right, #1e5fa8, #4a90d9); color: white">
        {{ ws }}
      </div>
      <v-btn
        v-for="item in MENU"
        :key="item.label"
        block
        size="x-large"
        height="72"
        color="primary"
        variant="outlined"
        class="mb-3"
        @click="goTo(ws, item.path)"
      >
        <v-icon start size="28">{{ item.icon }}</v-icon>
        {{ item.label }}
      </v-btn>
    </v-col>
  </v-row>
</template>
