import { apiDelete, apiGet, apiPost, apiPut } from './client'

const DOCTYPE = 'Sales Order'
const ITEM_DOCTYPE = 'Sales Order Item'

const LIST_FIELDS = [
  'name',
  'transaction_date',
  'status',
  'docstatus',
  'customer_name',
  'custom_site_company_name',
  'custom_delivery_address',
  'custom_delivery_address_detail',
  'delivery_date',
]

export interface SalesOrderListItem {
  name: string
  transaction_date: string
  status: string
  docstatus: 0 | 1 | 2
  customer_name: string
  custom_site_company_name: string | null
  custom_delivery_address: string | null
  custom_delivery_address_detail: string | null
  delivery_date: string | null
}

export interface SalesOrderListFilters {
  search?: string
  status?: string
  orderDateStart?: string
  orderDateEnd?: string
  deliveryDateStart?: string
  deliveryDateEnd?: string
}

interface ListResponse<T> {
  data: T[]
}

interface CountResponse {
  message: number
}

function buildFilters(f: SalesOrderListFilters): unknown[] {
  const filters: unknown[] = []
  if (f.search) filters.push(['name', 'like', `%${f.search}%`])
  if (f.status) filters.push(['status', '=', f.status])
  if (f.orderDateStart) filters.push(['transaction_date', '>=', f.orderDateStart])
  if (f.orderDateEnd) filters.push(['transaction_date', '<=', f.orderDateEnd])
  if (f.deliveryDateStart) filters.push(['delivery_date', '>=', f.deliveryDateStart])
  if (f.deliveryDateEnd) filters.push(['delivery_date', '<=', f.deliveryDateEnd])
  return filters
}

export async function listSalesOrders(
  filters: SalesOrderListFilters,
  offset: number,
  limit: number,
): Promise<{ items: SalesOrderListItem[]; total: number }> {
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
    apiGet<ListResponse<SalesOrderListItem>>(`/resource/${encodeURIComponent(DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

const LINE_FIELDS = [
  'name',
  'item_code',
  'item_name',
  'custom_mold',
  'qty',
  'custom_order_spec',
  'custom_order_weight',
  'custom_color',
  'custom_material',
  'custom_heat_treatment',
  'rate',
  'amount',
]

export interface SalesOrderItemListItem {
  name: string
  item_code: string
  item_name: string
  custom_mold: string | null
  qty: number
  custom_order_spec: string | null
  custom_order_weight: number | null
  custom_color: string | null
  custom_material: string | null
  custom_heat_treatment: string | null
  rate: number
  amount: number
}

export async function listSalesOrderItems(
  salesOrder: string,
  offset: number,
  limit: number,
): Promise<{ items: SalesOrderItemListItem[]; total: number }> {
  if (!salesOrder) {
    return { items: [], total: 0 }
  }

  const filters = [
    ['parent', '=', salesOrder],
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
    apiGet<ListResponse<SalesOrderItemListItem>>(`/resource/${encodeURIComponent(ITEM_DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

const optionsCache = new Map<string, string[]>()

export async function getSalesOrderFieldOptions(fieldname: string): Promise<string[]> {
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

export interface SalesOrderDoc {
  name: string
  customer: string
  customer_name: string
  transaction_date: string
  delivery_date: string | null
  custom_site_company_name: string | null
  custom_delivery_address: string | null
  custom_delivery_address_detail: string | null
  custom_remark: string | null
  status: string
  docstatus: 0 | 1 | 2
  net_total: number
  grand_total: number
}

interface DocResponse<T> {
  data: T
}

export async function getSalesOrder(name: string): Promise<SalesOrderDoc> {
  const res = await apiGet<DocResponse<SalesOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
  return res.data
}

export interface SalesOrderFormLine {
  item_code: string
  item_name: string
  qty: number
  rate: number
  custom_mold: string
  custom_order_spec: string
  custom_order_weight: number
  custom_color: string
  custom_material: string
  custom_heat_treatment: string
}

export interface SalesOrderFormState {
  customer: string
  customer_name: string
  transaction_date: string
  delivery_date: string
  custom_site_company_name: string
  custom_delivery_address: string
  custom_delivery_address_detail: string
  custom_remark: string
  items: SalesOrderFormLine[]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptySalesOrderForm(): SalesOrderFormState {
  return {
    customer: '',
    customer_name: '',
    transaction_date: today(),
    delivery_date: '',
    custom_site_company_name: '',
    custom_delivery_address: '',
    custom_delivery_address_detail: '',
    custom_remark: '',
    items: [],
  }
}

export function salesOrderDocToForm(doc: SalesOrderDoc, items: SalesOrderItemListItem[]): SalesOrderFormState {
  return {
    customer: doc.customer,
    customer_name: doc.customer_name ?? '',
    transaction_date: doc.transaction_date,
    delivery_date: doc.delivery_date ?? '',
    custom_site_company_name: doc.custom_site_company_name ?? '',
    custom_delivery_address: doc.custom_delivery_address ?? '',
    custom_delivery_address_detail: doc.custom_delivery_address_detail ?? '',
    custom_remark: doc.custom_remark ?? '',
    items: items.map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: item.qty,
      rate: item.rate,
      custom_mold: item.custom_mold ?? '',
      custom_order_spec: item.custom_order_spec ?? '',
      custom_order_weight: item.custom_order_weight ?? 0,
      custom_color: item.custom_color ?? '',
      custom_material: item.custom_material ?? '',
      custom_heat_treatment: item.custom_heat_treatment ?? '',
    })),
  }
}

export interface SalesOrderLineInput {
  item_code: string
  qty: number
  rate: number
  custom_mold?: string
  custom_order_spec?: string
  custom_order_weight?: number
  custom_color?: string
  custom_material?: string
  custom_heat_treatment?: string
}

export interface SalesOrderCreatePayload {
  customer: string
  company: string
  currency: string
  order_type: string
  transaction_date: string
  delivery_date: string
  custom_site_company_name?: string
  custom_delivery_address?: string
  custom_delivery_address_detail?: string
  custom_remark?: string
  items: SalesOrderLineInput[]
}

// company/currency/order_type은 화면에 노출하지 않고 항상 이 값으로 고정 전송한다
// (회사관리에서 만든 "JJtech", 그 기본통화 KRW, ERPNext가 요구하는 필수 Select 기본값 "Sales").
export function formToCreatePayload(form: SalesOrderFormState): SalesOrderCreatePayload {
  return {
    customer: form.customer,
    company: 'JJtech',
    currency: 'KRW',
    order_type: 'Sales',
    transaction_date: form.transaction_date,
    delivery_date: form.delivery_date,
    custom_site_company_name: form.custom_site_company_name || undefined,
    custom_delivery_address: form.custom_delivery_address || undefined,
    custom_delivery_address_detail: form.custom_delivery_address_detail || undefined,
    custom_remark: form.custom_remark || undefined,
    items: form.items.map((line) => ({
      item_code: line.item_code,
      qty: line.qty,
      rate: line.rate,
      custom_mold: line.custom_mold || undefined,
      custom_order_spec: line.custom_order_spec || undefined,
      custom_order_weight: line.custom_order_weight || undefined,
      custom_color: line.custom_color || undefined,
      custom_material: line.custom_material || undefined,
      custom_heat_treatment: line.custom_heat_treatment || undefined,
    })),
  }
}

export async function createSalesOrder(patch: SalesOrderCreatePayload): Promise<SalesOrderDoc> {
  const res = await apiPost<DocResponse<SalesOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}`, patch)
  return res.data
}

export type SalesOrderUpdatePayload = Partial<SalesOrderCreatePayload>

export async function updateSalesOrder(name: string, patch: SalesOrderUpdatePayload): Promise<SalesOrderDoc> {
  const res = await apiPut<DocResponse<SalesOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, patch)
  return res.data
}

export async function submitSalesOrder(name: string): Promise<SalesOrderDoc> {
  const res = await apiPut<DocResponse<SalesOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 1,
  })
  return res.data
}

export async function cancelSalesOrder(name: string): Promise<SalesOrderDoc> {
  const res = await apiPut<DocResponse<SalesOrderDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 2,
  })
  return res.data
}

export async function deleteSalesOrder(name: string): Promise<void> {
  await apiDelete(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
}

export const STATUS_LABELS: Record<string, string> = {
  Draft: '초안',
  'On Hold': '보류',
  'To Pay': '결제대기',
  'To Deliver and Bill': '미출고',
  'To Bill': '청구대기',
  'To Deliver': '미출고',
  Completed: '출고완료',
  Cancelled: '취소',
  Closed: '강제마감',
}
