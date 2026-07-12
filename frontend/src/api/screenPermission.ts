import { apiGet, apiPost } from './client'

const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.screen_permission_api'

interface MethodResponse<T> {
  message: T
}

// 라우터 route name과 정확히 일치해야 한다(router/index.ts, MainLayout.vue 사이드바 참고).
// 대시보드는 항상 열려있어 대상에서 뺀다.
export const SCREEN_GROUPS: { group: string; screens: { key: string; label: string }[] }[] = [
  {
    group: '기준정보',
    screens: [
      { key: 'companies', label: '회사 관리' },
      { key: 'customers', label: '거래처 관리' },
      { key: 'suppliers', label: '공급업체관리' },
      { key: 'items', label: '물품관리' },
      { key: 'molds', label: '금형관리' },
    ],
  },
  {
    group: '영업',
    screens: [
      { key: 'sales-orders', label: '주문관리' },
      { key: 'shipments', label: '출고관리' },
    ],
  },
  {
    group: '생산',
    screens: [{ key: 'work-orders', label: '작업지시' }],
  },
  {
    group: '재고',
    screens: [
      { key: 'purchase-orders', label: '발주관리' },
      { key: 'purchase-receipts', label: '입고관리' },
      { key: 'stock', label: '재고관리' },
    ],
  },
  {
    group: '설정',
    screens: [
      { key: 'users', label: '사용자관리' },
      { key: 'role-assignment', label: '권한관리' },
    ],
  },
]

export const SCREEN_KEYS: string[] = SCREEN_GROUPS.flatMap((g) => g.screens.map((s) => s.key))

export interface RoleScreenPermission {
  restricted: boolean
  screens: string[]
}

export async function getRoleScreenPermission(role: string): Promise<RoleScreenPermission> {
  const params = new URLSearchParams({ role })
  const res = await apiGet<MethodResponse<RoleScreenPermission>>(
    `${METHOD_PREFIX}.get_role_screen_permission?${params.toString()}`,
  )
  return res.message
}

export async function setRoleScreenPermission(role: string, screens: string[]): Promise<void> {
  await apiPost(`${METHOD_PREFIX}.set_role_screen_permission`, { role, screens: JSON.stringify(screens) })
}

export async function clearRoleScreenPermission(role: string): Promise<void> {
  await apiPost(`${METHOD_PREFIX}.clear_role_screen_permission`, { role })
}

export interface MyAllowedScreens {
  all: boolean
  screens: string[]
}

export async function getMyAllowedScreens(): Promise<MyAllowedScreens> {
  const res = await apiGet<MethodResponse<MyAllowedScreens>>(`${METHOD_PREFIX}.get_my_allowed_screens`)
  return res.message
}
