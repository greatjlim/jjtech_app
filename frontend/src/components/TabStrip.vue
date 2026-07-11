<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { tabsStore, tabsActions } from '@/stores/tabs'

const route = useRoute()
const router = useRouter()

const closeTab = (path: string) => {
  tabsActions.closeTab(path, route.path, router)
}
</script>

<template>
  <v-tabs v-if="tabsStore.tabs.length > 0" :model-value="route.path" bg-color="primary" show-arrows density="compact">
    <v-tab v-for="tab in tabsStore.tabs" :key="tab.path" :value="tab.path" :to="tab.path">
      <v-icon v-if="tab.icon" size="16" start>{{ tab.icon }}</v-icon>
      {{ tab.title }}
      <v-btn icon size="x-small" density="compact" variant="plain" class="ml-1" @click.stop.prevent="closeTab(tab.path)">
        <v-icon size="14">mdi-close</v-icon>
      </v-btn>
    </v-tab>
  </v-tabs>
</template>
