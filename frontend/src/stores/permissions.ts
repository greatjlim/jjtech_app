import { reactive, readonly } from 'vue'
import { getMyAllowedScreens } from '@/api/screenPermission'

const state = reactive({
  all: true,
  screens: new Set<string>(),
  ready: false,
})

async function load(): Promise<void> {
  try {
    const res = await getMyAllowedScreens()
    state.all = res.all
    state.screens = new Set(res.screens)
  } catch {
    // 조회 실패 시 화면을 잠그기보다는 기존처럼 전체 허용으로 둔다(락아웃 방지).
    state.all = true
    state.screens = new Set()
  } finally {
    state.ready = true
  }
}

function reset(): void {
  state.all = true
  state.screens = new Set()
  state.ready = false
}

function canAccess(screen: string): boolean {
  return state.all || state.screens.has(screen)
}

export const permissionsStore = readonly(state)

export const permissionsActions = {
  load,
  reset,
  canAccess,
}
