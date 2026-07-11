import { apiDelete, apiGet, apiPost, apiPut } from './client'

const DOCTYPE = 'Work Order'

const LIST_FIELDS = [
  'name',
  'production_item',
  'item_name',
  'qty',
  'custom_workstation',
  'custom_mold',
  'planned_start_date',
  'expected_delivery_date',
  'status',
  'docstatus',
]

export interface WorkOrderListItem {
  name: string
  production_item: string
  item_name: string
  qty: number
  custom_workstation: string | null
  custom_mold: string | null
  planned_start_date: string | null
  expected_delivery_date: string | null
  status: string
  docstatus: 0 | 1 | 2
}

export interface WorkOrderListFilters {
  search?: string
  workstation?: string
  status?: string
}

interface ListResponse<T> {
  data: T[]
}

interface CountResponse {
  message: number
}

function buildFilters(f: WorkOrderListFilters): unknown[] {
  const filters: unknown[] = []
  if (f.search) filters.push(['production_item', 'like', `%${f.search}%`])
  if (f.workstation) filters.push(['custom_workstation', '=', f.workstation])
  if (f.status) filters.push(['status', '=', f.status])
  return filters
}

export async function listWorkOrders(
  filters: WorkOrderListFilters,
  offset: number,
  limit: number,
): Promise<{ items: WorkOrderListItem[]; total: number }> {
  const f = buildFilters(filters)

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'creation desc',
  })
  const countParams = new URLSearchParams({ doctype: DOCTYPE })
  if (f.length) {
    listParams.set('filters', JSON.stringify(f))
    countParams.set('filters', JSON.stringify(f))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<WorkOrderListItem>>(`/resource/${encodeURIComponent(DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

export interface WorkOrderDoc {
  name: string
  production_item: string
  item_name: string
  qty: number
  custom_workstation: string
  custom_mold: string | null
  planned_start_date: string
  expected_delivery_date: string | null
  status: string
  docstatus: 0 | 1 | 2
  bom_no: string | null
}

interface DocResponse<T> {
  data: T
}

export async function getWorkOrder(name: string): Promise<WorkOrderDoc> {
  const res = await apiGet<DocResponse<WorkOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
  return res.data
}

export interface WorkOrderFormState {
  production_item: string
  qty: number
  custom_workstation: string
  custom_mold: string
  planned_start_date: string
  expected_delivery_date: string
}

export function emptyWorkOrderForm(): WorkOrderFormState {
  return {
    production_item: '',
    qty: 1,
    custom_workstation: '',
    custom_mold: '',
    planned_start_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: '',
  }
}

export function workOrderDocToForm(doc: WorkOrderDoc): WorkOrderFormState {
  return {
    production_item: doc.production_item,
    qty: doc.qty,
    custom_workstation: doc.custom_workstation,
    custom_mold: doc.custom_mold ?? '',
    planned_start_date: (doc.planned_start_date || '').slice(0, 10),
    expected_delivery_date: doc.expected_delivery_date ?? '',
  }
}

// company/currency 등은 화면에 노출하지 않고 고정 전송한다(회사관리에서 만든 "JJtech").
// bom_no/fg_warehouse는 Work Order 제출에 필요한 필수값이지만 이 화면에서 실제로 쓰이는 개념이
// 아니라서(자재 추적을 안 하는 범위) 품목별로 미리 만들어둔 더미 BOM을 자동으로 붙인다.
const ITEM_BOM_MAP: Record<string, string> = {
  'ALU-PROFILE-A': 'BOM-ALU-PROFILE-A-001',
  'ALU-PROFILE-B': 'BOM-ALU-PROFILE-B-001',
  'ALU-PROFILE-C': 'BOM-ALU-PROFILE-C-001',
}

export interface WorkOrderCreatePayload {
  production_item: string
  qty: number
  company: string
  bom_no: string
  fg_warehouse: string
  skip_transfer: 1
  custom_workstation: string
  custom_mold?: string
  planned_start_date: string
  expected_delivery_date?: string
}

export function formToCreatePayload(form: WorkOrderFormState): WorkOrderCreatePayload {
  return {
    production_item: form.production_item,
    qty: form.qty,
    company: 'JJtech',
    bom_no: ITEM_BOM_MAP[form.production_item] ?? '',
    fg_warehouse: 'Finished Goods - J',
    skip_transfer: 1,
    custom_workstation: form.custom_workstation,
    custom_mold: form.custom_mold || undefined,
    planned_start_date: form.planned_start_date,
    expected_delivery_date: form.expected_delivery_date || undefined,
  }
}

export async function createWorkOrder(patch: WorkOrderCreatePayload): Promise<WorkOrderDoc> {
  const res = await apiPost<DocResponse<WorkOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}`, patch)
  return res.data
}

export type WorkOrderUpdatePayload = Partial<WorkOrderCreatePayload>

export async function updateWorkOrder(name: string, patch: WorkOrderUpdatePayload): Promise<WorkOrderDoc> {
  const res = await apiPut<DocResponse<WorkOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, patch)
  return res.data
}

export async function submitWorkOrder(name: string): Promise<WorkOrderDoc> {
  const res = await apiPut<DocResponse<WorkOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 1,
  })
  return res.data
}

export async function cancelWorkOrder(name: string): Promise<WorkOrderDoc> {
  const res = await apiPut<DocResponse<WorkOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 2,
  })
  return res.data
}

export async function deleteWorkOrder(name: string): Promise<void> {
  await apiDelete(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
}

const optionsCache = new Map<string, string[]>()

export async function getWorkOrderFieldOptions(fieldname: string): Promise<string[]> {
  if (optionsCache.has(fieldname)) {
    return optionsCache.get(fieldname) as string[]
  }
  const res = await apiGet<{ data: { fields: { fieldname: string; options?: string }[] } }>(
    `/resource/DocType/${encodeURIComponent(DOCTYPE)}`,
  )
  const field = res.data.fields.find((f) => f.fieldname === fieldname)
  const options = field?.options ? field.options.split('\n').filter(Boolean) : []
  optionsCache.set(fieldname, options)
  return options
}

export async function listWorkstations(): Promise<string[]> {
  const res = await apiGet<ListResponse<{ name: string }>>(
    `/resource/Workstation?fields=${encodeURIComponent('["name"]')}&limit_page_length=0`,
  )
  return res.data.map((row) => row.name)
}
