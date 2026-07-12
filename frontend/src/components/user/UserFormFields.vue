<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LabelWithElement from '@/components/LabelWithElement.vue'
import { listAllRoles, type UserFormState } from '@/api/user'

withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
  }>(),
  { mode: 'edit' },
)

const form = defineModel<UserFormState>({ required: true })

const roleOptions = ref<string[]>([])

onMounted(async () => {
  roleOptions.value = await listAllRoles()
})
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <LabelWithElement title="이메일" required>
        <v-text-field v-model="form.email" type="email" :disabled="mode === 'edit'" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="3">
      <LabelWithElement title="성" required>
        <v-text-field v-model="form.first_name" maxlength="50" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="3">
      <LabelWithElement title="이름">
        <v-text-field v-model="form.last_name" maxlength="50" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement :title="mode === 'create' ? '비밀번호' : '비밀번호 재설정'">
        <v-text-field
          v-model="form.new_password"
          type="password"
          autocomplete="new-password"
          :placeholder="mode === 'edit' ? '변경할 때만 입력' : undefined"
        />
      </LabelWithElement>
    </v-col>
    <v-col cols="12" md="6">
      <LabelWithElement title="사용여부">
        <v-switch v-model="form.enabled" color="primary" hide-details label="사용" />
      </LabelWithElement>
    </v-col>
    <v-col cols="12">
      <LabelWithElement title="역할">
        <v-select
          v-model="form.roles"
          :items="roleOptions"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="comfortable"
        />
      </LabelWithElement>
    </v-col>
  </v-row>
</template>
