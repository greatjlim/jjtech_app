import { apiDelete, apiGet, apiPost, apiPut } from './client'

export interface ItemListItem {
  name: string
  item_name: string
  standard_rate: number | null
}

interface ListResponse<T> {
  data: T[]
}

export async function searchItems(search: string, limit = 50): Promise<ItemListItem[]> {
  const filters: unknown[] = [['is_sales_item', '=', 1]]
  if (search) {
    filters.push(['item_name', 'like', `%${search}%`])
  }
  const params = new URLSearchParams({
    fields: JSON.stringify(['name', 'item_name', 'standard_rate']),
    filters: JSON.stringify(filters),
    limit_page_length: String(limit),
    order_by: 'item_name asc',
  })
  const res = await apiGet<ListResponse<ItemListItem>>(`/resource/Item?${params.toString()}`)
  return res.data
}

// 물품관리 (기준정보) CRUD — reference/front-end-main의 물품관리 화면을 Item DocType에 포팅

const DOCTYPE = 'Item'

const LIST_FIELDS = [
  'name',
  'item_name',
  'item_group',
  'stock_uom',
  'standard_rate',
  'custom_purchase_price',
  'custom_vat',
  'custom_register_date',
  'description',
  'disabled',
]

export interface ItemManagementListItem {
  name: string
  item_name: string
  item_group: string | null
  stock_uom: string | null
  standard_rate: number | null
  custom_purchase_price: number | null
  custom_vat: number | null
  custom_register_date: string | null
  description: string | null
  disabled: 0 | 1
}

export interface ItemManagementFilters {
  search?: string
  useOrNot?: 'all' | 'Y' | 'N'
}

interface CountResponse {
  message: number
}

function buildFilters(f: ItemManagementFilters): unknown[] {
  const filters: unknown[] = []
  if (f.search) filters.push(['item_name', 'like', `%${f.search}%`])
  if (f.useOrNot === 'Y') filters.push(['disabled', '=', 0])
  if (f.useOrNot === 'N') filters.push(['disabled', '=', 1])
  return filters
}

export async function listItems(
  filters: ItemManagementFilters,
  offset: number,
  limit: number,
): Promise<{ items: ItemManagementListItem[]; total: number }> {
  const f = buildFilters(filters)

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'item_name asc',
  })
  const countParams = new URLSearchParams({ doctype: DOCTYPE })
  if (f.length) {
    listParams.set('filters', JSON.stringify(f))
    countParams.set('filters', JSON.stringify(f))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<ItemManagementListItem>>(`/resource/${encodeURIComponent(DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

export interface ItemDoc {
  name: string
  item_code: string
  item_name: string
  item_group: string | null
  stock_uom: string
  standard_rate: number | null
  custom_purchase_price: number | null
  custom_vat: number | null
  custom_register_date: string | null
  description: string | null
  disabled: 0 | 1
}

interface DocResponse<T> {
  data: T
}

export async function getItem(name: string): Promise<ItemDoc> {
  const res = await apiGet<DocResponse<ItemDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
  return res.data
}

export interface ItemFormState {
  item_code: string
  item_name: string
  item_group: string
  stock_uom: string
  standard_rate: number
  custom_purchase_price: number
  custom_vat: number
  custom_register_date: string
  description: string
  useOrNot: 'Y' | 'N'
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyItemForm(): ItemFormState {
  return {
    item_code: '',
    item_name: '',
    item_group: '',
    stock_uom: 'Nos',
    standard_rate: 0,
    custom_purchase_price: 0,
    custom_vat: 0,
    custom_register_date: today(),
    description: '',
    useOrNot: 'Y',
  }
}

export function itemDocToForm(doc: ItemDoc): ItemFormState {
  return {
    item_code: doc.item_code ?? doc.name,
    item_name: doc.item_name ?? '',
    item_group: doc.item_group ?? '',
    stock_uom: doc.stock_uom ?? 'Nos',
    standard_rate: doc.standard_rate ?? 0,
    custom_purchase_price: doc.custom_purchase_price ?? 0,
    custom_vat: doc.custom_vat ?? 0,
    custom_register_date: (doc.custom_register_date || today()).slice(0, 10),
    description: doc.description ?? '',
    useOrNot: doc.disabled ? 'N' : 'Y',
  }
}

export type ItemUpdatePayload = Partial<Omit<ItemDoc, 'name' | 'item_code'>>

export function formToUpdatePayload(form: ItemFormState): ItemUpdatePayload {
  return {
    item_name: form.item_name,
    item_group: form.item_group || undefined,
    stock_uom: form.stock_uom,
    standard_rate: form.standard_rate,
    custom_purchase_price: form.custom_purchase_price,
    custom_vat: form.custom_vat,
    custom_register_date: form.custom_register_date,
    description: form.description,
    disabled: form.useOrNot === 'N' ? 1 : 0,
  }
}

export async function updateItem(name: string, patch: ItemUpdatePayload): Promise<ItemDoc> {
  const res = await apiPut<DocResponse<ItemDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, patch)
  return res.data
}

export interface ItemCreatePayload extends ItemUpdatePayload {
  item_code: string
  item_name: string
  is_sales_item: 1
}

export function formToCreatePayload(form: ItemFormState): ItemCreatePayload {
  return {
    item_code: form.item_code,
    item_name: form.item_name,
    is_sales_item: 1,
    ...formToUpdatePayload(form),
  }
}

export async function createItem(patch: ItemCreatePayload): Promise<ItemDoc> {
  const res = await apiPost<DocResponse<ItemDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}`, patch)
  return res.data
}

export async function deleteItem(name: string): Promise<void> {
  await apiDelete(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
}
