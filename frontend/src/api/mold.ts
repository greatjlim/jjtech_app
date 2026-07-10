import { apiGet } from './client'

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

interface ListResponse<T> {
  data: T[]
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
