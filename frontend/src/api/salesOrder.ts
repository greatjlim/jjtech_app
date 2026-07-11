import { apiGet } from './client'

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

const LINE_FIELDS = ['name', 'item_code', 'item_name', 'custom_mold', 'qty', 'custom_order_spec', 'custom_order_weight', 'rate', 'amount']

export interface SalesOrderItemListItem {
  name: string
  item_code: string
  item_name: string
  custom_mold: string | null
  qty: number
  custom_order_spec: string | null
  custom_order_weight: number | null
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
