import { apiGet } from './client'

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
