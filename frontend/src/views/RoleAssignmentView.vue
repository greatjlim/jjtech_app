<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import RoleUserAddDialog from '@/components/roleAssignment/RoleUserAddDialog.vue'
import {
  addRoleToUser,
  listAllRoles,
  listUsersByRole,
  removeRoleFromUser,
  type AssignableUser,
  type UserByRole,
} from '@/api/user'
import {
  clearRoleScreenPermission,
  getRoleScreenPermission,
  setRoleScreenPermission,
  SCREEN_GROUPS,
} from '@/api/screenPermission'
import { ApiError } from '@/api/client'

const roleOptions = ref<string[]>([])
const selectedRole = ref('')
const users = ref<UserByRole[]>([])
const loading = ref(false)
const showAdd = ref(false)

const screenRestricted = ref(false)
const allowedScreens = ref<Set<string>>(new Set())
const screenLoading = ref(false)
const screenSaving = ref(false)

const loadScreenPermission = async () => {
  if (!selectedRole.value) return
  screenLoading.value = true
  try {
    const res = await getRoleScreenPermission(selectedRole.value)
    screenRestricted.value = res.restricted
    allowedScreens.value = res.restricted
      ? new Set(res.screens)
      : new Set(SCREEN_GROUPS.flatMap((g) => g.screens.map((s) => s.key)))
  } finally {
    screenLoading.value = false
  }
}

const saveScreenPermission = async () => {
  screenSaving.value = true
  try {
    await setRoleScreenPermission(selectedRole.value, Array.from(allowedScreens.value))
    screenRestricted.value = true
    notify('success', '화면 접근권한을 저장했습니다.')
  } catch (e) {
    notify('error', e instanceof ApiError ? e.message : '저장에 실패했습니다.')
  } finally {
    screenSaving.value = false
  }
}

const resetScreenPermission = async () => {
  if (!window.confirm(`"${selectedRole.value}" 역할의 화면 제한을 해제하고 전체 허용으로 되돌리시겠습니까?`)) return
  screenSaving.value = true
  try {
    await clearRoleScreenPermission(selectedRole.value)
    notify('success', '전체 허용으로 되돌렸습니다.')
    await loadScreenPermission()
  } catch (e) {
    notify('error', e instanceof ApiError ? e.message : '처리에 실패했습니다.')
  } finally {
    screenSaving.value = false
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const notify = (color: 'success' | 'error', text: string) => {
  snackbarColor.value = color
  snackbarText.value = text
  snackbar.value = true
}

onMounted(async () => {
  roleOptions.value = await listAllRoles()
})

const load = async () => {
  if (!selectedRole.value) {
    users.value = []
    return
  }
  loading.value = true
  try {
    users.value = await listUsersByRole(selectedRole.value)
  } finally {
    loading.value = false
  }
}

watch(selectedRole, () => {
  load()
  loadScreenPermission()
})

const toggleScreen = (key: string) => {
  if (allowedScreens.value.has(key)) {
    allowedScreens.value.delete(key)
  } else {
    allowedScreens.value.add(key)
  }
}

const onAdd = async (user: AssignableUser) => {
  try {
    await addRoleToUser(user.name, selectedRole.value)
    notify('success', `${user.full_name}님에게 역할을 부여했습니다.`)
    load()
  } catch (e) {
    notify('error', e instanceof ApiError ? e.message : '처리에 실패했습니다.')
  }
}

const removeUser = async (row: UserByRole) => {
  if (!window.confirm(`${row.full_name}님의 "${selectedRole.value}" 역할을 해제하시겠습니까?`)) return
  try {
    await removeRoleFromUser(row.name, selectedRole.value)
    notify('success', '역할을 해제했습니다.')
    load()
  } catch (e) {
    notify('error', e instanceof ApiError ? e.message : '처리에 실패했습니다.')
  }
}
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-4">권한 관리</h1>
  <v-card elevation="2">
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <LabelWithElement title="역할 선택">
            <v-autocomplete
              v-model="selectedRole"
              :items="roleOptions"
              variant="outlined"
              density="comfortable"
              placeholder="역할을 선택하세요"
            />
          </LabelWithElement>
        </v-col>
      </v-row>

      <template v-if="selectedRole">
        <div class="d-flex align-center justify-space-between mb-2">
          <h6 class="text-h6">"{{ selectedRole }}" 역할을 가진 사용자</h6>
          <v-btn color="primary" variant="text" prepend-icon="mdi-plus" @click="showAdd = true">사용자 추가</v-btn>
        </div>
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>사용여부</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in users" :key="row.name">
              <td>{{ row.full_name }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.enabled ? '사용' : '중지' }}</td>
              <td>
                <v-btn size="small" color="error" variant="text" @click="removeUser(row)">제거</v-btn>
              </td>
            </tr>
            <tr v-if="!loading && users.length === 0">
              <td colspan="4" class="text-center text-medium-emphasis">이 역할을 가진 사용자가 없습니다</td>
            </tr>
          </tbody>
        </v-table>
      </template>
    </v-card-text>
  </v-card>

  <v-card v-if="selectedRole" elevation="2" class="mt-4" :loading="screenLoading">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-2">
        <h6 class="text-h6">"{{ selectedRole }}" 역할의 화면 접근권한</h6>
        <v-chip v-if="!screenRestricted" color="success" size="small" variant="tonal">전체 허용</v-chip>
        <v-chip v-else color="warning" size="small" variant="tonal">제한됨</v-chip>
      </div>
      <p class="text-body-2 text-medium-emphasis mb-4">
        아직 저장한 적 없는 역할은 지금처럼 모든 화면에 접근할 수 있습니다. 체크를 조정하고 저장하면 그 순간부터
        체크된 화면만 보이도록 제한됩니다.
      </p>
      <v-row v-for="g in SCREEN_GROUPS" :key="g.group">
        <v-col cols="12">
          <div class="text-subtitle-2 font-weight-bold mb-1">{{ g.group }}</div>
          <v-row dense>
            <v-col v-for="s in g.screens" :key="s.key" cols="6" sm="4" md="3">
              <v-checkbox
                :model-value="allowedScreens.has(s.key)"
                :label="s.label"
                density="compact"
                hide-details
                @update:model-value="toggleScreen(s.key)"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <div class="d-flex justify-end mt-2" style="gap: 8px">
        <v-btn variant="text" :disabled="screenSaving" @click="resetScreenPermission">제한 해제(전체 허용)</v-btn>
        <v-btn color="primary" variant="tonal" :loading="screenSaving" @click="saveScreenPermission">저장</v-btn>
      </div>
    </v-card-text>
  </v-card>

  <RoleUserAddDialog v-model="showAdd" :role="selectedRole" @add="onAdd" />

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
    {{ snackbarText }}
  </v-snackbar>
</template>
