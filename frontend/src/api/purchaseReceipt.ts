import { apiDelete, apiGet, apiPost, apiPut } from './client'

const DOCTYPE = 'Purchase Receipt'
const ITEM_DOCTYPE = 'Purchase Receipt Item'
const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.purchase_api'

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

const LIST_FIELDS = ['name', 'posting_date', 'status', 'docstatus', 'supplier_name', 'set_warehouse', 'remarks']

export interface PurchaseReceiptListItem {
  name: string
  posting_date: string
  status: string
  docstatus: 0 | 1 | 2
  supplier_name: string
  set_warehouse: string | null
  remarks: string | null
}

export interface PurchaseReceiptListFilters {
  search?: string
  dateStart?: string
  dateEnd?: string
}

function buildFilters(f: PurchaseReceiptListFilters): unknown[] {
  const filters: unknown[] = []
  if (f.search) filters.push(['name', 'like', `%${f.search}%`])
  if (f.dateStart) filters.push(['posting_date', '>=', f.dateStart])
  if (f.dateEnd) filters.push(['posting_date', '<=', f.dateEnd])
  return filters
}

export async function listPurchaseReceipts(
  filters: PurchaseReceiptListFilters,
  offset: number,
  limit: number,
): Promise<{ items: PurchaseReceiptListItem[]; total: number }> {
  const f = buildFilters(filters)

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'posting_date desc, creation desc',
  })
  const countParams = new URLSearchParams({ doctype: DOCTYPE })
  if (f.length) {
    listParams.set('filters', JSON.stringify(f))
    countParams.set('filters', JSON.stringify(f))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<PurchaseReceiptListItem>>(`/resource/${encodeURIComponent(DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

const LINE_FIELDS = ['name', 'item_code', 'item_name', 'qty', 'rate', 'warehouse', 'purchase_order', 'purchase_order_item']

export interface PurchaseReceiptItemListItem {
  name: string
  item_code: string
  item_name: string
  qty: number
  rate: number
  warehouse: string
  purchase_order: string | null
  purchase_order_item: string | null
}

export async function listPurchaseReceiptItems(
  purchaseReceipt: string,
  offset: number,
  limit: number,
): Promise<{ items: PurchaseReceiptItemListItem[]; total: number }> {
  if (!purchaseReceipt) {
    return { items: [], total: 0 }
  }

  const filters = [
    ['parent', '=', purchaseReceipt],
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
    apiGet<ListResponse<PurchaseReceiptItemListItem>>(`/resource/${encodeURIComponent(ITEM_DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

export interface PurchaseReceiptDoc {
  name: string
  supplier: string
  supplier_name: string
  posting_date: string
  set_warehouse: string | null
  remarks: string | null
  status: string
  docstatus: 0 | 1 | 2
}

export async function getPurchaseReceipt(name: string): Promise<PurchaseReceiptDoc> {
  const res = await apiGet<DocResponse<PurchaseReceiptDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
  return res.data
}

export interface PurchaseReceiptFormLine {
  item_code: string
  item_name: string
  qty: number
  rate: number
  warehouse: string
  purchase_order: string
  purchase_order_item: string
}

export interface PurchaseReceiptFormState {
  supplier: string
  supplier_name: string
  posting_date: string
  set_warehouse: string
  remarks: string
  items: PurchaseReceiptFormLine[]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyPurchaseReceiptForm(): PurchaseReceiptFormState {
  return {
    supplier: '',
    supplier_name: '',
    posting_date: today(),
    set_warehouse: '',
    remarks: '',
    items: [],
  }
}

export function purchaseReceiptDocToForm(doc: PurchaseReceiptDoc, items: PurchaseReceiptItemListItem[]): PurchaseReceiptFormState {
  return {
    supplier: doc.supplier,
    supplier_name: doc.supplier_name ?? '',
    posting_date: doc.posting_date,
    set_warehouse: doc.set_warehouse ?? '',
    remarks: doc.remarks ?? '',
    items: items.map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: item.qty,
      rate: item.rate,
      warehouse: item.warehouse,
      purchase_order: item.purchase_order ?? '',
      purchase_order_item: item.purchase_order_item ?? '',
    })),
  }
}

export interface PurchaseReceiptLineInput {
  item_code: string
  qty: number
  rate?: number
  warehouse: string
  purchase_order?: string
  purchase_order_item?: string
}

export interface PurchaseReceiptCreatePayload {
  supplier: string
  company: string
  posting_date: string
  set_posting_time: 1
  set_warehouse?: string
  remarks?: string
  items: PurchaseReceiptLineInput[]
}

export function formToCreatePayload(form: PurchaseReceiptFormState): PurchaseReceiptCreatePayload {
  return {
    supplier: form.supplier,
    company: 'JJtech',
    posting_date: form.posting_date,
    set_posting_time: 1,
    set_warehouse: form.set_warehouse || undefined,
    remarks: form.remarks || undefined,
    items: form.items.map((line) => ({
      item_code: line.item_code,
      qty: line.qty,
      rate: line.rate || undefined,
      warehouse: line.warehouse || form.set_warehouse,
      purchase_order: line.purchase_order || undefined,
      purchase_order_item: line.purchase_order_item || undefined,
    })),
  }
}

export async function createPurchaseReceipt(patch: PurchaseReceiptCreatePayload): Promise<PurchaseReceiptDoc> {
  const res = await apiPost<DocResponse<PurchaseReceiptDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}`, patch)
  return res.data
}

export type PurchaseReceiptUpdatePayload = Partial<PurchaseReceiptCreatePayload>

export async function updatePurchaseReceipt(name: string, patch: PurchaseReceiptUpdatePayload): Promise<PurchaseReceiptDoc> {
  const res = await apiPut<DocResponse<PurchaseReceiptDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, patch)
  return res.data
}

export async function submitPurchaseReceipt(name: string): Promise<PurchaseReceiptDoc> {
  const res = await apiPut<DocResponse<PurchaseReceiptDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 1,
  })
  return res.data
}

export async function cancelPurchaseReceipt(name: string): Promise<PurchaseReceiptDoc> {
  const res = await apiPut<DocResponse<PurchaseReceiptDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 2,
  })
  return res.data
}

export async function deletePurchaseReceipt(name: string): Promise<void> {
  await apiDelete(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
}

export const STATUS_LABELS: Record<string, string> = {
  Draft: '임시저장',
  'Partly Billed': '일부청구',
  'To Bill': '청구대기',
  Completed: '완료',
  Return: '반품',
  'Return Issued': '반품처리',
  Cancelled: '취소',
  Closed: '강제마감',
}

export interface ReceivablePoItem {
  purchase_order_item: string
  purchase_order: string
  item_code: string
  item_name: string
  order_qty: number
  rate: number
  schedule_date: string | null
  supplier: string
  supplier_name: string
  transaction_date: string
  received_qty: number
  remaining_qty: number
}

export async function listReceivablePoItems(search?: string): Promise<ReceivablePoItem[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const res = await apiGet<MethodResponse<ReceivablePoItem[]>>(`${METHOD_PREFIX}.list_receivable_po_items?${params.toString()}`)
  return res.message
}
