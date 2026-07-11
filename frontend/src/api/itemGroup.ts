import { apiGet } from './client'

export const ITEM_GROUP_ROOT = 'All Item Groups'

export interface ItemGroupNode {
  name: string
  item_group_name: string
  is_group: 0 | 1
}

interface ListResponse<T> {
  data: T[]
}

export async function listItemGroupChildren(parent: string): Promise<ItemGroupNode[]> {
  const params = new URLSearchParams({
    fields: JSON.stringify(['name', 'item_group_name', 'is_group']),
    filters: JSON.stringify([['parent_item_group', '=', parent]]),
    limit_page_length: '0',
    order_by: 'item_group_name asc',
  })
  const res = await apiGet<ListResponse<ItemGroupNode>>(`/resource/Item%20Group?${params.toString()}`)
  return res.data
}

// 리프(item_group)에서 parent_item_group을 따라 올라가며 "대분류 > 중분류 > 소분류" 경로를
// 재구성한다. 트리가 최대 3단이라 반복 조회 비용은 낮다.
export async function getItemGroupAncestors(name: string): Promise<ItemGroupNode[]> {
  const path: ItemGroupNode[] = []
  let current = name
  let guard = 0
  while (current && current !== ITEM_GROUP_ROOT && guard < 10) {
    const res = await apiGet<{ data: ItemGroupNode & { parent_item_group: string } }>(
      `/resource/Item%20Group/${encodeURIComponent(current)}`,
    )
    path.unshift({ name: res.data.name, item_group_name: res.data.item_group_name, is_group: res.data.is_group })
    current = res.data.parent_item_group
    guard += 1
  }
  return path
}
