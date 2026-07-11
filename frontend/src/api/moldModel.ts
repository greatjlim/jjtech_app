import { apiDelete, apiGet, apiPost, apiPut } from './client'

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
  cutting_method: string | null
  billet_length: number | null
  billet_qty: number | null
  extrusion_length: number | null
  pieces_per_billet: number | null
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

export function emptyMoldModelForm(): Partial<MoldModelDoc> {
  return {
    model_number: '',
    business_type: '',
    order_type: '',
    vendor: '',
    vendor_model_number: '',
    site_name: '',
    mold_type: '',
    purpose: '',
    texture_heat_treatment: '',
    surface_treatment_method: '',
    nitrogen_gas: 0,
    drawing_image: '',
    insulation_division: '',
    insulation_type_name: '',
    insulation_area: 0,
    partner_type: '',
    partner_company: '',
    partner_model_number: '',
    quality_precaution_flag: 0,
    quality_precaution: '',
    cutting_method: '',
    billet_length: 0,
    billet_qty: 0,
    extrusion_length: 0,
    pieces_per_billet: 0,
    stock: 0,
    thickness: 0,
    internal_surface_area: 0,
    area: 0,
    circumscriber: 0,
    unit_weight: 0,
    width: 0,
    external_surface_area: 0,
    height: 0,
    use_or_not: 1,
    creation_date: '',
    modification_date: '',
    modification_content: '',
    disposal_date: '',
    disposal_reason: '',
  }
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

export async function deleteMoldModel(name: string): Promise<void> {
  await apiDelete(`/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(name)}`)
}

export async function searchMoldModels(search: string, limit = 50): Promise<MoldModelListItem[]> {
  const filters: unknown[] = search ? [['model_number', 'like', `%${search}%`]] : []
  const params = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_page_length: String(limit),
    order_by: 'model_number asc',
  })
  if (filters.length) {
    params.set('filters', JSON.stringify(filters))
  }
  const res = await apiGet<{ data: MoldModelListItem[] }>(`/resource/${encodeURIComponent(DOCTYPE)}?${params.toString()}`)
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
