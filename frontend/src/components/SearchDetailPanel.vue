<script setup lang="ts">
import { computed } from 'vue'

// reference/front-end-main components/common/search-detail-input.vue 스타일 이식.
const open = defineModel<boolean>({ default: false })
const openInner = computed({
  get: () => (open.value ? 0 : undefined),
  set: (value) => {
    open.value = value !== undefined
  },
})
</script>

<template>
  <div class="search-detail-panel">
    <v-expansion-panels v-model="openInner">
      <v-expansion-panel>
        <v-expansion-panel-title>
          상세검색 {{ open ? '닫기' : '열기' }}
          <template #actions>
            <v-icon size="18">{{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <slot />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped>
.search-detail-panel {
  width: 100%;
  margin-bottom: 40px;
}
.search-detail-panel :deep(.v-expansion-panel) {
  border-bottom: 1px solid rgb(var(--v-theme-borderColor));
  border-radius: 0;
  background: transparent;
}
.search-detail-panel :deep(.v-expansion-panel__shadow) {
  box-shadow: none;
}
.search-detail-panel :deep(.v-expansion-panel-title) {
  background-color: rgb(var(--v-theme-surface));
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  justify-content: center;
  width: 150px;
  height: 34px;
  min-height: auto;
  padding: 0;
  font-size: 13px;
  border: 1px solid rgb(var(--v-theme-borderColor));
  border-top: none;
  border-radius: 0 0 20px 20px;
  color: rgb(var(--v-theme-textSecondary));
  z-index: 1;
}
.search-detail-panel :deep(.v-expansion-panel-title__icon) {
  margin-inline-start: 4px;
}
.search-detail-panel :deep(.v-expansion-panel-title__overlay) {
  display: none;
}
.search-detail-panel :deep(.v-expansion-panel-text__wrapper) {
  padding: 24px 0 8px;
}
</style>
