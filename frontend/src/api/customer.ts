import { apiGet } from './client'

const LIST_FIELDS = [
  'name',
  'customer_name',
  'custom_representative_name',
  'tax_id',
  'custom_phone_number',
  'custom_address_main',
]

export interface CustomerListItem {
  name: string
  customer_name: string
  custom_representative_name: string | null
  tax_id: string | null
  custom_phone_number: string | null
  custom_address_main: string | null
}

interface ListResponse<T> {
  data: T[]
}

interface CountResponse {
  message: number
}

export async function listCustomers(
  search: string,
  offset: number,
  limit: number,
): Promise<{ items: CustomerListItem[]; total: number }> {
  const filters = search ? [['customer_name', 'like', `%${search}%`]] : []

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'customer_name asc',
  })
  const countParams = new URLSearchParams({ doctype: 'Customer' })
  if (filters.length) {
    listParams.set('filters', JSON.stringify(filters))
    countParams.set('filters', JSON.stringify(filters))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<CustomerListItem>>(`/resource/Customer?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}
