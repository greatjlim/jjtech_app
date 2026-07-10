import { apiDelete, apiGet, apiPost, apiPut } from './client'

const LIST_FIELDS = [
  'name',
  'mold_model',
  'mold_number',
  'manufacturer',
  'b_diameter',
  'extrusion_rate',
  'hole_count',
  'diameter',
  'dimension',
  'current_status',
  'production_reason',
  'production_receipt_date',
  'disposal_date',
  'disposal_reason',
]

export interface MoldListItem {
  name: string
  mold_model: string
  mold_number: string
  manufacturer: string | null
  b_diameter: number | null
  extrusion_rate: number | null
  hole_count: number | null
  diameter: number | null
  dimension: number | null
  current_status: string | null
  production_reason: string | null
  production_receipt_date: string | null
  disposal_date: string | null
  disposal_reason: string | null
}

export type MoldDoc = MoldListItem

interface ListResponse<T> {
  data: T[]
}

interface DocResponse<T> {
  data: T
}

interface CountResponse {
  message: number
}

export async function listMolds(
  moldModel: string,
  offset: number,
  limit: number,
): Promise<{ items: MoldListItem[]; total: number }> {
  if (!moldModel) {
    return { items: [], total: 0 }
  }

  const filters = [['mold_model', '=', moldModel]]
  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    filters: JSON.stringify(filters),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'mold_number asc',
  })
  const countParams = new URLSearchParams({
    doctype: 'Mold',
    filters: JSON.stringify(filters),
  })

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<MoldListItem>>(`/resource/Mold?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

export async function getMold(name: string): Promise<MoldDoc> {
  const res = await apiGet<DocResponse<MoldDoc>>(`/resource/Mold/${encodeURIComponent(name)}`)
  return res.data
}

export type MoldUpdatePayload = Partial<Omit<MoldDoc, 'name'>>
export type MoldCreatePayload = MoldUpdatePayload & { mold_model: string; mold_number: string }

export async function updateMold(name: string, patch: MoldUpdatePayload): Promise<MoldDoc> {
  const res = await apiPut<DocResponse<MoldDoc>>(`/resource/Mold/${encodeURIComponent(name)}`, patch)
  return res.data
}

export async function createMold(patch: MoldCreatePayload): Promise<MoldDoc> {
  const res = await apiPost<DocResponse<MoldDoc>>('/resource/Mold', patch)
  return res.data
}

export async function deleteMold(name: string): Promise<void> {
  await apiDelete(`/resource/Mold/${encodeURIComponent(name)}`)
}

const optionsCache = new Map<string, string[]>()

export async function getMoldFieldOptions(fieldname: string): Promise<string[]> {
  if (optionsCache.has(fieldname)) {
    return optionsCache.get(fieldname) as string[]
  }
  const res = await apiGet<{ data: { fields: { fieldname: string; options?: string }[] } }>('/resource/DocType/Mold')
  const field = res.data.fields.find((f) => f.fieldname === fieldname)
  const options = field?.options ? field.options.split('\n').filter(Boolean) : []
  optionsCache.set(fieldname, options)
  return options
}

export function emptyMoldForm(moldModel: string): MoldCreatePayload {
  return {
    mold_model: moldModel,
    mold_number: '',
    manufacturer: '',
    b_diameter: 0,
    extrusion_rate: 0,
    hole_count: 0,
    diameter: 0,
    dimension: 0,
    current_status: '',
    production_reason: '',
    production_receipt_date: '',
    disposal_date: '',
    disposal_reason: '',
  }
}
