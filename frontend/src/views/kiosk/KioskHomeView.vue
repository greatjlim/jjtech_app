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
    <v-col v-for="ws in workstations" :key="ws" cols="12" lg="6" xl="4">
      <v-card class="pa-5 h-100" elevation="6">
        <div class="ws-title mb-5">
          <v-icon size="36" color="primary">mdi-cog</v-icon>
          {{ ws }}
        </div>
        <v-row dense>
          <v-col v-for="item in MENU" :key="item.label" cols="6">
            <v-card
              class="menu-tile d-flex flex-column align-center justify-center text-center"
              variant="outlined"
              @click="goTo(ws, item.path)"
            >
              <v-icon size="60" color="primary">{{ item.icon }}</v-icon>
              <div class="menu-tile-label mt-3">{{ item.label }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.ws-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 2rem;
  font-weight: 800;
}
.menu-tile {
  min-height: 200px;
  border-width: 2px !important;
  transition: transform 0.1s ease, border-color 0.1s ease;
}
.menu-tile:active {
  transform: scale(0.97);
  border-color: rgb(var(--v-theme-primary)) !important;
}
.menu-tile-label {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.3;
  padding: 0 8px;
  color: rgb(var(--v-theme-on-surface));
}
</style>
