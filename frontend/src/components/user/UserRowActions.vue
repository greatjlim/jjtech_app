<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community'
import type { UserListItem } from '@/api/user'

// 다른 목록화면과 달리 삭제 버튼이 없다 — User 삭제는 그 계정이 소유/생성한
// 문서 이력까지 걸려있어 위험도가 높아, ERPNext에서도 보통 사용중지로 처리한다.
const props = defineProps<{
  params: ICellRendererParams<UserListItem> & {
    onEdit: (name: string) => void
    onToggleEnabled: (row: UserListItem) => void
  }
}>()
</script>

<template>
  <div>
    <v-tooltip text="수정">
      <template #activator="{ props: tooltipProps }">
        <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onEdit(props.params.data!.name)">
          <v-icon size="20" color="primary">mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-tooltip :text="props.params.data!.enabled ? '사용중지' : '사용'">
      <template #activator="{ props: tooltipProps }">
        <v-btn v-bind="tooltipProps" icon flat variant="plain" @click="props.params.onToggleEnabled(props.params.data!)">
          <v-icon size="20" :color="props.params.data!.enabled ? 'error' : 'success'">
            {{ props.params.data!.enabled ? 'mdi-account-off' : 'mdi-account-check' }}
          </v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </div>
</template>
