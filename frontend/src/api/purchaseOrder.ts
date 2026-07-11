import { apiDelete, apiGet, apiPost, apiPut } from './client'

const DOCTYPE = 'Purchase Order'
const ITEM_DOCTYPE = 'Purchase Order Item'

const LIST_FIELDS = ['name', 'transaction_date', 'status', 'docstatus', 'supplier_name', 'schedule_date', 'custom_remark']

export interface PurchaseOrderListItem {
  name: string
  transaction_date: string
  status: string
  docstatus: 0 | 1 | 2
  supplier_name: string
  schedule_date: string | null
  custom_remark: string | null
}

export interface PurchaseOrderListFilters {
  search?: string
  status?: string
  orderDateStart?: string
  orderDateEnd?: string
}

interface ListResponse<T> {
  data: T[]
}

interface CountResponse {
  message: number
}

function buildFilters(f: PurchaseOrderListFilters): unknown[] {
  const filters: unknown[] = []
  if (f.search) filters.push(['name', 'like', `%${f.search}%`])
  if (f.status) filters.push(['status', '=', f.status])
  if (f.orderDateStart) filters.push(['transaction_date', '>=', f.orderDateStart])
  if (f.orderDateEnd) filters.push(['transaction_date', '<=', f.orderDateEnd])
  return filters
}

export async function listPurchaseOrders(
  filters: PurchaseOrderListFilters,
  offset: number,
  limit: number,
): Promise<{ items: PurchaseOrderListItem[]; total: number }> {
  const f = buildFilters(filters)

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'transaction_date desc',
  })
  const countParams = new URLSearchParams({ doctype: DOCTYPE })
  if (f.length) {
    listParams.set('filters', JSON.stringify(f))
    countParams.set('filters', JSON.stringify(f))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<PurchaseOrderListItem>>(`/resource/${encodeURIComponent(DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

const LINE_FIELDS = ['name', 'item_code', 'item_name', 'qty', 'rate', 'amount', 'schedule_date']

export interface PurchaseOrderItemListItem {
  name: string
  item_code: string
  item_name: string
  qty: number
  rate: number
  amount: number
  schedule_date: string | null
}

export async function listPurchaseOrderItems(
  purchaseOrder: string,
  offset: number,
  limit: number,
): Promise<{ items: PurchaseOrderItemListItem[]; total: number }> {
  if (!purchaseOrder) {
    return { items: [], total: 0 }
  }

  const filters = [
    ['parent', '=', purchaseOrder],
    ['parenttype', '=', DOCTYPE],
  ]
  const listParams = new URLSearchParams({
    fields: JSON.stringify(LINE_FIELDS),
    filters: JSON.stringify(filters),
    parent: DOCTYPE,
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'idx asc',
  })
  const countParams = new URLSearchParams({
    doctype: ITEM_DOCTYPE,
    filters: JSON.stringify(filters),
  })

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<PurchaseOrderItemListItem>>(`/resource/${encodeURIComponent(ITEM_DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

const optionsCache = new Map<string, string[]>()

export async function getPurchaseOrderFieldOptions(fieldname: string): Promise<string[]> {
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

export interface PurchaseOrderDoc {
  name: string
  supplier: string
  supplier_name: string
  transaction_date: string
  schedule_date: string | null
  custom_remark: string | null
  status: string
  docstatus: 0 | 1 | 2
  net_total: number
  grand_total: number
}

interface DocResponse<T> {
  data: T
}

export async function getPurchaseOrder(name: string): Promise<PurchaseOrderDoc> {
  const res = await apiGet<DocResponse<PurchaseOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
  return res.data
}

export interface PurchaseOrderFormLine {
  item_code: string
  item_name: string
  qty: number
  rate: number
  schedule_date: string
}

export interface PurchaseOrderFormState {
  supplier: string
  supplier_name: string
  transaction_date: string
  schedule_date: string
  custom_remark: string
  items: PurchaseOrderFormLine[]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyPurchaseOrderForm(): PurchaseOrderFormState {
  return {
    supplier: '',
    supplier_name: '',
    transaction_date: today(),
    schedule_date: '',
    custom_remark: '',
    items: [],
  }
}

export function purchaseOrderDocToForm(doc: PurchaseOrderDoc, items: PurchaseOrderItemListItem[]): PurchaseOrderFormState {
  return {
    supplier: doc.supplier,
    supplier_name: doc.supplier_name ?? '',
    transaction_date: doc.transaction_date,
    schedule_date: doc.schedule_date ?? '',
    custom_remark: doc.custom_remark ?? '',
    items: items.map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: item.qty,
      rate: item.rate,
      schedule_date: item.schedule_date ?? '',
    })),
  }
}

export interface PurchaseOrderLineInput {
  item_code: string
  qty: number
  rate: number
  schedule_date?: string
}

export interface PurchaseOrderCreatePayload {
  supplier: string
  company: string
  currency: string
  transaction_date: string
  schedule_date: string
  custom_remark?: string
  items: PurchaseOrderLineInput[]
}

// company/currency는 화면에 노출하지 않고 항상 이 값으로 고정 전송한다(Sales Order와 동일 패턴).
export function formToCreatePayload(form: PurchaseOrderFormState): PurchaseOrderCreatePayload {
  return {
    supplier: form.supplier,
    company: 'JJtech',
    currency: 'KRW',
    transaction_date: form.transaction_date,
    schedule_date: form.schedule_date,
    custom_remark: form.custom_remark || undefined,
    items: form.items.map((line) => ({
      item_code: line.item_code,
      qty: line.qty,
      rate: line.rate,
      schedule_date: line.schedule_date || undefined,
    })),
  }
}

export async function createPurchaseOrder(patch: PurchaseOrderCreatePayload): Promise<PurchaseOrderDoc> {
  const res = await apiPost<DocResponse<PurchaseOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}`, patch)
  return res.data
}

export type PurchaseOrderUpdatePayload = Partial<PurchaseOrderCreatePayload>

export async function updatePurchaseOrder(name: string, patch: PurchaseOrderUpdatePayload): Promise<PurchaseOrderDoc> {
  const res = await apiPut<DocResponse<PurchaseOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, patch)
  return res.data
}

export async function submitPurchaseOrder(name: string): Promise<PurchaseOrderDoc> {
  const res = await apiPut<DocResponse<PurchaseOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 1,
  })
  return res.data
}

export async function cancelPurchaseOrder(name: string): Promise<PurchaseOrderDoc> {
  const res = await apiPut<DocResponse<PurchaseOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 2,
  })
  return res.data
}

export async function deletePurchaseOrder(name: string): Promise<void> {
  await apiDelete(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
}

export const STATUS_LABELS: Record<string, string> = {
  Draft: '초안',
  'On Hold': '보류',
  'To Receive and Bill': '미입고',
  'To Bill': '청구대기',
  'To Receive': '미입고',
  Completed: '입고완료',
  Cancelled: '취소',
  Closed: '강제마감',
  Delivered: '입고완료',
}
