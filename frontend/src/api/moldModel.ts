import { apiGet, apiPut, apiPost } from './client'

const DOCTYPE = 'Mold Model'

const LIST_FIELDS = [
  'name',
  'model_number',
  'order_type',
  'vendor',
  'vendor_model_number',
  'mold_type',
  'texture_heat_treatment',
  'purpose',
  'unit_weight',
  'quality_precaution',
  'creation_date',
  'disposal_date',
  'use_or_not',
]

export interface MoldModelListItem {
  name: string
  model_number: string
  order_type: string | null
  vendor: string | null
  vendor_model_number: string | null
  mold_type: string | null
  texture_heat_treatment: string | null
  purpose: string | null
  unit_weight: number | null
  quality_precaution: string | null
  creation_date: string | null
  disposal_date: string | null
  use_or_not: 0 | 1
}

export interface MoldModelDoc {
  name: string
  model_number: string
  business_type: string | null
  order_type: string | null
  vendor: string
  vendor_model_number: string | null
  site_name: string | null
  mold_type: string
  purpose: string | null
  texture_heat_treatment: string | null
  surface_treatment_method: string | null
  nitrogen_gas: 0 | 1
  drawing_image: string | null
  insulation_division: string | null
  insulation_type_name: string | null
  insulation_area: number | null
  partner_type: string
  partner_company: string | null
  partner_model_number: string | null
  quality_precaution_flag: 0 | 1
  quality_precaution: string | null
  stock: number | null
  thickness: number | null
  internal_surface_area: number | null
  area: number | null
  circumscriber: number | null
  unit_weight: number
  width: number | null
  external_surface_area: number | null
  height: number | null
  use_or_not: 0 | 1
  creation_date: string | null
  modification_date: string | null
  modification_content: string | null
  disposal_date: string | null
  disposal_reason: string | null
}

export interface MoldModelListFilters {
  search?: string
  partnerType?: string
  useOrNot?: 'Y' | 'N'
  purposes?: string[]
  orderTypes?: string[]
  registerStartDate?: string
  registerEndDate?: string
}

interface ListResponse<T> {
  data: T[]
}

interface DocResponse<T> {
  data: T
}

interface CountResponse {
  message: number
}

function buildFilters(f: MoldModelListFilters): unknown[] {
  const filters: unknown[] = []
  if (f.search) filters.push(['model_number', 'like', `%${f.search}%`])
  if (f.partnerType) filters.push(['partner_type', '=', f.partnerType])
  if (f.useOrNot) filters.push(['use_or_not', '=', f.useOrNot === 'Y' ? 1 : 0])
  if (f.purposes?.length) filters.push(['purpose', 'in', f.purposes])
  if (f.orderTypes?.length) filters.push(['order_type', 'in', f.orderTypes])
  if (f.registerStartDate) filters.push(['creation_date', '>=', f.registerStartDate])
  if (f.registerEndDate) filters.push(['creation_date', '<=', f.registerEndDate])
  return filters
}

export async function listMoldModels(
  filters: MoldModelListFilters,
  offset: number,
  limit: number,
): Promise<{ items: MoldModelListItem[]; total: number }> {
  const f = buildFilters(filters)

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'model_number asc',
  })
  const countParams = new URLSearchParams({ doctype: DOCTYPE })
  if (f.length) {
    listParams.set('filters', JSON.stringify(f))
    countParams.set('filters', JSON.stringify(f))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<MoldModelListItem>>(`/resource/${encodeURIComponent(DOCTYPE)}?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

export async function getMoldModel(name: string): Promise<MoldModelDoc> {
  const res = await apiGet<DocResponse<MoldModelDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
  return res.data
}

export type MoldModelUpdatePayload = Partial<Omit<MoldModelDoc, 'name' | 'model_number'>>
export type MoldModelCreatePayload = MoldModelUpdatePayload & { model_number: string }

export async function updateMoldModel(name: string, patch: MoldModelUpdatePayload): Promise<MoldModelDoc> {
  const res = await apiPut<DocResponse<MoldModelDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`, patch)
  return res.data
}

export async function createMoldModel(patch: MoldModelCreatePayload): Promise<MoldModelDoc> {
  const res = await apiPost<DocResponse<MoldModelDoc>>(`/resource/${encodeURIComponent(DOCTYPE)}`, patch)
  return res.data
}

const optionsCache = new Map<string, string[]>()

export async function getMoldModelFieldOptions(fieldname: string): Promise<string[]> {
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
