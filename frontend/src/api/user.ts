import { apiGet, apiPost, apiPut } from './client'

const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.user_api'

interface ListResponse<T> {
  data: T[]
}

interface CountResponse {
  message: number
}

interface DocResponse<T> {
  data: T
}

interface MethodResponse<T> {
  message: T
}

const LIST_FIELDS = ['name', 'full_name', 'enabled', 'user_type']

export interface UserListItem {
  name: string
  full_name: string
  enabled: 0 | 1
  user_type: string
}

export async function listUsers(
  search: string,
  offset: number,
  limit: number,
): Promise<{ items: UserListItem[]; total: number }> {
  const filters: unknown[] = [['user_type', '=', 'System User']]
  if (search) filters.push(['full_name', 'like', `%${search}%`])

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    filters: JSON.stringify(filters),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'full_name asc',
  })
  const countParams = new URLSearchParams({ doctype: 'User', filters: JSON.stringify(filters) })

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<UserListItem>>(`/resource/User?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

interface UserDocRaw {
  name: string
  full_name: string
  first_name: string
  last_name: string | null
  enabled: 0 | 1
  roles: { role: string }[]
}

export interface UserDoc {
  name: string
  full_name: string
  first_name: string
  last_name: string | null
  enabled: 0 | 1
  roles: string[]
}

export async function getUser(name: string): Promise<UserDoc> {
  const res = await apiGet<DocResponse<UserDocRaw>>(`/resource/User/${encodeURIComponent(name)}`)
  return { ...res.data, roles: (res.data.roles ?? []).map((r) => r.role) }
}

export interface UserFormState {
  email: string
  first_name: string
  last_name: string
  enabled: boolean
  roles: string[]
  new_password: string
}

export function emptyUserForm(): UserFormState {
  return {
    email: '',
    first_name: '',
    last_name: '',
    enabled: true,
    roles: [],
    new_password: '',
  }
}

export function userDocToForm(doc: UserDoc): UserFormState {
  return {
    email: doc.name,
    first_name: doc.first_name ?? '',
    last_name: doc.last_name ?? '',
    enabled: doc.enabled === 1,
    roles: doc.roles,
    new_password: '',
  }
}

interface UserMutationPayload {
  first_name: string
  last_name: string
  enabled: 0 | 1
  roles: { role: string }[]
  new_password?: string
}

function formToMutationPayload(form: UserFormState): UserMutationPayload {
  const payload: UserMutationPayload = {
    first_name: form.first_name,
    last_name: form.last_name,
    enabled: form.enabled ? 1 : 0,
    roles: form.roles.map((role) => ({ role })),
  }
  if (form.new_password) payload.new_password = form.new_password
  return payload
}

export interface UserCreatePayload extends UserMutationPayload {
  email: string
  send_welcome_email: 0
}

export function formToCreatePayload(form: UserFormState): UserCreatePayload {
  return {
    email: form.email,
    send_welcome_email: 0,
    ...formToMutationPayload(form),
  }
}

export async function createUser(patch: UserCreatePayload): Promise<UserDoc> {
  const res = await apiPost<DocResponse<UserDocRaw>>('/resource/User', patch)
  return { ...res.data, roles: (res.data.roles ?? []).map((r) => r.role) }
}

export type UserUpdatePayload = UserMutationPayload

export function formToUpdatePayload(form: UserFormState): UserUpdatePayload {
  return formToMutationPayload(form)
}

export async function updateUser(name: string, patch: UserUpdatePayload): Promise<UserDoc> {
  const res = await apiPut<DocResponse<UserDocRaw>>(`/resource/User/${encodeURIComponent(name)}`, patch)
  return { ...res.data, roles: (res.data.roles ?? []).map((r) => r.role) }
}

// 목록 화면의 사용/중지 토글용 — 전체 폼 값 없이 이 필드 하나만 부분 갱신한다.
export async function setUserEnabled(name: string, enabled: boolean): Promise<void> {
  await apiPut(`/resource/User/${encodeURIComponent(name)}`, { enabled: enabled ? 1 : 0 })
}

export interface RoleOption {
  name: string
}

export async function listAllRoles(): Promise<string[]> {
  const params = new URLSearchParams({
    fields: JSON.stringify(['name']),
    filters: JSON.stringify([['disabled', '=', 0]]),
    limit_page_length: '0',
    order_by: 'name asc',
  })
  const res = await apiGet<ListResponse<RoleOption>>(`/resource/Role?${params.toString()}`)
  return res.data.map((r) => r.name)
}

export interface UserByRole {
  name: string
  full_name: string
  enabled: 0 | 1
}

export async function listUsersByRole(role: string, search?: string): Promise<UserByRole[]> {
  const params = new URLSearchParams({ role })
  if (search) params.set('search', search)
  const res = await apiGet<MethodResponse<UserByRole[]>>(`${METHOD_PREFIX}.list_users_by_role?${params.toString()}`)
  return res.message
}

export interface AssignableUser {
  name: string
  full_name: string
}

export async function listAssignableUsers(role: string, search?: string): Promise<AssignableUser[]> {
  const params = new URLSearchParams({ role })
  if (search) params.set('search', search)
  const res = await apiGet<MethodResponse<AssignableUser[]>>(
    `${METHOD_PREFIX}.list_assignable_users?${params.toString()}`,
  )
  return res.message
}

export async function addRoleToUser(user: string, role: string): Promise<void> {
  await apiPost(`${METHOD_PREFIX}.add_role_to_user`, { user, role })
}

export async function removeRoleFromUser(user: string, role: string): Promise<void> {
  await apiPost(`${METHOD_PREFIX}.remove_role_from_user`, { user, role })
}
