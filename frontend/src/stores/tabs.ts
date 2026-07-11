import { reactive, readonly } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

export interface Tab {
  path: string
  title: string
  icon?: string
}

const state = reactive({
  tabs: [] as Tab[],
})

// 현재 라우트에 tabTitle이 있으면(=탭으로 관리할 화면이면) 이미 열려있는지 확인하고,
// 없으면 새 탭을 추가한다. 로그인 화면 등 tabTitle이 없는 라우트는 무시한다.
function syncFromRoute(route: RouteLocationNormalizedLoaded): void {
  const title = route.meta.tabTitle
  if (!title) return

  const exists = state.tabs.some((tab) => tab.path === route.path)
  if (!exists) {
    state.tabs.push({ path: route.path, title, icon: route.meta.tabIcon })
  }
}

// 탭을 닫는다. 닫는 탭이 현재 활성 탭(currentPath)이면 이웃 탭(마지막탭이었으면 앞,
// 아니면 뒤)으로 이동한다. 마지막 남은 탭이면 대시보드로 이동한다.
// 이미 대시보드에 있는 상태에서 그 탭을 닫는 경우처럼 push가 무동작(같은 경로)일 수
// 있어, 그 경우엔 라우트 변경 감지에 기대지 않고 직접 재동기화한다.
function closeTab(path: string, currentPath: string, router: Router): void {
  const index = state.tabs.findIndex((tab) => tab.path === path)
  if (index === -1) return

  const isActive = path === currentPath
  const wasLast = index === state.tabs.length - 1

  state.tabs.splice(index, 1)

  if (!isActive) return

  if (state.tabs.length === 0) {
    router.push('/dashboard').then(() => syncFromRoute(router.currentRoute.value))
    return
  }

  const target = state.tabs[wasLast ? index - 1 : index]
  router.push(target.path)
}

export const tabsStore = readonly(state)

export const tabsActions = {
  syncFromRoute,
  closeTab,
}
