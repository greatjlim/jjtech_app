import { reactive, readonly } from 'vue'
import { apiPostForm } from '@/api/client'

const state = reactive({
  isAuthenticated: false,
  user: null as string | null,
  fullName: null as string | null,
  ready: false,
})

// Frappe는 로그인/로그아웃 시 user_id, full_name을 일반(non-HttpOnly) 쿠키로 내려준다.
// 서버 상태의 신뢰 가능한 원본이므로 이 쿠키를 그대로 읽어 클라이언트 상태를 동기화한다.
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// user_id 등은 non-HttpOnly라 JS로 지울 수 있다. 서버 로그아웃 호출이 실패하더라도
// 클라이언트 쪽 인증 판단(=user_id 쿠키)은 확실히 로그아웃 상태로 만들기 위해 사용한다.
function clearReadableAuthCookies(): void {
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT'
  for (const name of ['user_id', 'full_name', 'system_user', 'user_lang']) {
    document.cookie = `${name}=; expires=${expired}; path=/`
  }
}

function syncFromCookies(): void {
  const userId = readCookie('user_id')
  if (!userId || userId === 'Guest') {
    state.isAuthenticated = false
    state.user = null
    state.fullName = null
  } else {
    state.isAuthenticated = true
    state.user = userId
    state.fullName = readCookie('full_name') ?? userId
  }
  state.ready = true
}

async function login(usr: string, pwd: string): Promise<void> {
  await apiPostForm('/method/login', { usr, pwd })
  syncFromCookies()
}

async function logout(): Promise<void> {
  try {
    await apiPostForm('/method/logout', {})
  } finally {
    clearReadableAuthCookies()
    syncFromCookies()
  }
}

function checkSession(): boolean {
  syncFromCookies()
  return state.isAuthenticated
}

export const authStore = readonly(state)

export const authActions = {
  login,
  logout,
  checkSession,
}
