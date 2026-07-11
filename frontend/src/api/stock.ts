import { apiGet } from './client'

const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.stock_api'

interface MethodResponse<T> {
  message: T
}

interface ListResponse<T> {
  data: T[]
}

export interface StockStatusItem {
  item_code: string
  item_name: string
  item_group: string | null
  warehouse: string
  actual_qty: number
  reserved_qty: number
  projected_qty: number
  valuation_rate: number
  stock_value: number
}

export interface StockStatusFilters {
  search?: string
  warehouse?: string
  onlyInStock?: boolean
}

export async function listStockStatus(
  filters: StockStatusFilters,
  offset: number,
  limit: number,
): Promise<{ items: StockStatusItem[]; total: number }> {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  })
  if (filters.search) params.set('search', filters.search)
  if (filters.warehouse) params.set('warehouse', filters.warehouse)
  if (filters.onlyInStock) params.set('only_in_stock', '1')

  const res = await apiGet<MethodResponse<{ items: StockStatusItem[]; total: number }>>(
    `${METHOD_PREFIX}.list_stock_status?${params.toString()}`,
  )
  return res.message
}

export interface StockLedgerEntryItem {
  name: string
  posting_date: string
  posting_time: string
  voucher_type: string
  voucher_no: string
  actual_qty: number
  qty_after_transaction: number
  incoming_rate: number
  valuation_rate: number
  stock_value: number
}

export async function listStockLedger(
  itemCode: string,
  warehouse: string,
  offset: number,
  limit: number,
): Promise<{ items: StockLedgerEntryItem[]; total: number }> {
  if (!itemCode || !warehouse) {
    return { items: [], total: 0 }
  }
  const params = new URLSearchParams({
    item_code: itemCode,
    warehouse,
    offset: String(offset),
    limit: String(limit),
  })
  const res = await apiGet<MethodResponse<{ items: StockLedgerEntryItem[]; total: number }>>(
    `${METHOD_PREFIX}.list_stock_ledger?${params.toString()}`,
  )
  return res.message
}

export interface WarehouseOption {
  name: string
}

export async function listWarehouses(): Promise<WarehouseOption[]> {
  const params = new URLSearchParams({
    fields: JSON.stringify(['name']),
    filters: JSON.stringify([['is_group', '=', 0]]),
    limit_page_length: '0',
    order_by: 'name asc',
  })
  const res = await apiGet<ListResponse<WarehouseOption>>(`/resource/Warehouse?${params.toString()}`)
  return res.data
}

export const VOUCHER_TYPE_LABELS: Record<string, string> = {
  'Delivery Note': '출고전표',
  'Stock Reconciliation': '재고조정',
  'Stock Entry': '재고이동',
  'Purchase Receipt': '구매입고',
  'Sales Invoice': '판매전표',
}
