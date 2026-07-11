import { apiDelete, apiGet, apiPost, apiPut } from './client'

const DOCTYPE = 'Shipment'
const ITEM_DOCTYPE = 'Shipment Item'
const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.shipment_api'

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

const LIST_FIELDS = [
  'name',
  'shipment_date',
  'vehicle_no',
  'vehicle_type',
  'freight_cost',
  'dispatch_location',
  'total_ship_weight',
  'docstatus',
]

export interface ShipmentListItem {
  name: string
  shipment_date: string
  vehicle_no: string | null
  vehicle_type: string | null
  freight_cost: number
  dispatch_location: string | null
  total_ship_weight: number
  docstatus: 0 | 1 | 2
}

export interface ShipmentListFilters {
  search?: string
  dateStart?: string
  dateEnd?: string
}

function buildFilters(f: ShipmentListFilters): unknown[] {
  const filters: unknown[] = []
  if (f.search) filters.push(['name', 'like', `%${f.search}%`])
  if (f.dateStart) filters.push(['shipment_date', '>=', f.dateStart])
  if (f.dateEnd) filters.push(['shipment_date', '<=', f.dateEnd])
  return filters
}

export async function listShipments(
  filters: ShipmentListFilters,
  offset: number,
  limit: number,
): Promise<{ items: ShipmentListItem[]; total: number }> {
  const f = buildFilters(filters)

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'shipment_date desc, creation desc',
  })
  const countParams = new URLSearchParams({ doctype: DOCTYPE })
  if (f.length) {
    listParams.set('filters', JSON.stringify(f))
    countParams.set('filters', JSON.stringify(f))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<ShipmentListItem>>(`/resource/${encodeURIComponent(DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

const LINE_FIELDS = [
  'name',
  'item_code',
  'item_name',
  'customer',
  'customer_name',
  'mold_model',
  'spec',
  'color',
  'material',
  'heat_treatment',
  'sales_order',
  'sales_order_item',
  'packaging',
  'order_qty',
  'ship_qty',
  'ship_weight',
  'delivery_note',
]

export interface ShipmentItemListItem {
  name: string
  item_code: string
  item_name: string
  customer: string
  customer_name: string
  mold_model: string | null
  spec: string | null
  color: string | null
  material: string | null
  heat_treatment: string | null
  sales_order: string | null
  sales_order_item: string | null
  packaging: string | null
  order_qty: number
  ship_qty: number
  ship_weight: number
  delivery_note: string | null
}

export async function listShipmentItems(
  shipment: string,
  offset: number,
  limit: number,
): Promise<{ items: ShipmentItemListItem[]; total: number }> {
  if (!shipment) {
    return { items: [], total: 0 }
  }

  const filters = [
    ['parent', '=', shipment],
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
    apiGet<ListResponse<ShipmentItemListItem>>(`/resource/${encodeURIComponent(ITEM_DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

export interface ShipmentDoc {
  name: string
  shipment_date: string
  vehicle_no: string | null
  vehicle_type: string | null
  freight_cost: number
  dispatch_location: string | null
  remark: string | null
  total_ship_weight: number
  docstatus: 0 | 1 | 2
}

export async function getShipment(name: string): Promise<ShipmentDoc> {
  const res = await apiGet<DocResponse<ShipmentDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
  return res.data
}

export interface ShipmentFormLine {
  item_code: string
  item_name: string
  customer: string
  customer_name: string
  mold_model: string
  spec: string
  color: string
  material: string
  heat_treatment: string
  sales_order: string
  sales_order_item: string
  packaging: string
  order_qty: number
  ship_qty: number
  ship_weight: number
}

export interface ShipmentFormState {
  shipment_date: string
  vehicle_no: string
  vehicle_type: string
  freight_cost: number
  dispatch_location: string
  remark: string
  items: ShipmentFormLine[]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyShipmentForm(): ShipmentFormState {
  return {
    shipment_date: today(),
    vehicle_no: '',
    vehicle_type: '',
    freight_cost: 0,
    dispatch_location: '',
    remark: '',
    items: [],
  }
}

export function shipmentDocToForm(doc: ShipmentDoc, items: ShipmentItemListItem[]): ShipmentFormState {
  return {
    shipment_date: doc.shipment_date,
    vehicle_no: doc.vehicle_no ?? '',
    vehicle_type: doc.vehicle_type ?? '',
    freight_cost: doc.freight_cost ?? 0,
    dispatch_location: doc.dispatch_location ?? '',
    remark: doc.remark ?? '',
    items: items.map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      customer: item.customer,
      customer_name: item.customer_name,
      mold_model: item.mold_model ?? '',
      spec: item.spec ?? '',
      color: item.color ?? '',
      material: item.material ?? '',
      heat_treatment: item.heat_treatment ?? '',
      sales_order: item.sales_order ?? '',
      sales_order_item: item.sales_order_item ?? '',
      packaging: item.packaging ?? '',
      order_qty: item.order_qty ?? 0,
      ship_qty: item.ship_qty,
      ship_weight: item.ship_weight ?? 0,
    })),
  }
}

export interface ShipmentLineInput {
  item_code: string
  item_name?: string
  customer: string
  customer_name?: string
  mold_model?: string
  spec?: string
  color?: string
  material?: string
  heat_treatment?: string
  sales_order?: string
  sales_order_item?: string
  packaging?: string
  order_qty?: number
  ship_qty: number
  ship_weight?: number
}

export interface ShipmentCreatePayload {
  shipment_date: string
  vehicle_no?: string
  vehicle_type?: string
  freight_cost?: number
  dispatch_location?: string
  remark?: string
  items: ShipmentLineInput[]
}

export function formToCreatePayload(form: ShipmentFormState): ShipmentCreatePayload {
  return {
    shipment_date: form.shipment_date,
    vehicle_no: form.vehicle_no || undefined,
    vehicle_type: form.vehicle_type || undefined,
    freight_cost: form.freight_cost || undefined,
    dispatch_location: form.dispatch_location || undefined,
    remark: form.remark || undefined,
    items: form.items.map((line) => ({
      item_code: line.item_code,
      item_name: line.item_name || undefined,
      customer: line.customer,
      customer_name: line.customer_name || undefined,
      mold_model: line.mold_model || undefined,
      spec: line.spec || undefined,
      color: line.color || undefined,
      material: line.material || undefined,
      heat_treatment: line.heat_treatment || undefined,
      sales_order: line.sales_order || undefined,
      sales_order_item: line.sales_order_item || undefined,
      packaging: line.packaging || undefined,
      order_qty: line.order_qty || undefined,
      ship_qty: line.ship_qty,
      ship_weight: line.ship_weight || undefined,
    })),
  }
}

export async function createShipment(patch: ShipmentCreatePayload): Promise<ShipmentDoc> {
  const res = await apiPost<DocResponse<ShipmentDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}`, patch)
  return res.data
}

export type ShipmentUpdatePayload = Partial<ShipmentCreatePayload>

export async function updateShipment(name: string, patch: ShipmentUpdatePayload): Promise<ShipmentDoc> {
  const res = await apiPut<DocResponse<ShipmentDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, patch)
  return res.data
}

export async function submitShipment(name: string): Promise<ShipmentDoc> {
  const res = await apiPut<DocResponse<ShipmentDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 1,
  })
  return res.data
}

export async function cancelShipment(name: string): Promise<ShipmentDoc> {
  const res = await apiPut<DocResponse<ShipmentDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, {
    docstatus: 2,
  })
  return res.data
}

export async function deleteShipment(name: string): Promise<void> {
  await apiDelete(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
}

export const DOCSTATUS_LABELS: Record<number, string> = {
  0: '임시저장',
  1: '확정',
  2: '취소',
}

export interface ShippableSalesOrderItem {
  sales_order_item: string
  sales_order: string
  item_code: string
  item_name: string
  order_qty: number
  mold_model: string | null
  spec: string | null
  color: string | null
  material: string | null
  heat_treatment: string | null
  order_weight: number | null
  customer: string
  customer_name: string
  transaction_date: string
  shipped_qty: number
  remaining_qty: number
}

export async function listShippableSalesOrderItems(search?: string): Promise<ShippableSalesOrderItem[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const res = await apiGet<MethodResponse<ShippableSalesOrderItem[]>>(
    `${METHOD_PREFIX}.list_shippable_sales_order_items?${params.toString()}`,
  )
  return res.message
}

export interface ShippablePackaging {
  packaging: string
  pack_qty: number
  work_order: string
  mold_model: string | null
  sales_order: string | null
  sales_order_item: string | null
  item_code: string | null
  item_name: string | null
  spec: string | null
  color: string | null
  material: string | null
  heat_treatment: string | null
  customer: string | null
  customer_name: string | null
  shipped_qty: number
  remaining_qty: number
}

export async function listShippablePackagings(search?: string): Promise<ShippablePackaging[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const res = await apiGet<MethodResponse<ShippablePackaging[]>>(`${METHOD_PREFIX}.list_shippable_packagings?${params.toString()}`)
  return res.message
}
