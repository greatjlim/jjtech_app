<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authActions } from '@/stores/auth'
import { ApiError } from '@/api/client'
import AuthLayout from '@/layouts/AuthLayout.vue'

const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const submit = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    await authActions.login(username.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (e) {
    errorMessage.value = e instanceof ApiError ? e.message : '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h2 class="text-h4 font-weight-bold mb-2">JJTech에 오신 것을 환영합니다</h2>
    <div class="text-subtitle-1 text-medium-emphasis mb-8">업무 관리를 위해 로그인하세요</div>

    <v-form @submit.prevent="submit">
      <v-label class="text-subtitle-2 font-weight-medium mb-2">사용자 ID / 이메일</v-label>
      <v-text-field
        v-model="username"
        class="mb-6"
        autocomplete="username"
        required
        hide-details="auto"
      />

      <v-label class="text-subtitle-2 font-weight-medium mb-2">비밀번호</v-label>
      <v-text-field
        v-model="password"
        class="mb-6"
        type="password"
        autocomplete="current-password"
        required
        hide-details="auto"
      />

      <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-btn type="submit" color="primary" size="large" block flat :loading="loading">
        로그인
      </v-btn>
    </v-form>
  </AuthLayout>
</template>
