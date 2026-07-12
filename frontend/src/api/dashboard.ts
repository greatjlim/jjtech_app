import { apiGet } from './client'

const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.dashboard_api'

interface MethodResponse<T> {
  message: T
}

export interface WorkOrderStatusCount {
  status: string
  count: number
}

export interface KpiSummary {
  sales_order: { draft: number; open: number; this_month_count: number }
  work_order: WorkOrderStatusCount[]
  shipment: { this_month_count: number; this_month_weight: number }
  purchase_order: { pending_receipt_count: number }
  stock: { item_count: number; zero_stock_count: number }
}

export async function getKpiSummary(): Promise<KpiSummary> {
  const res = await apiGet<MethodResponse<KpiSummary>>(`${METHOD_PREFIX}.get_kpi_summary`)
  return res.message
}

export interface SalesTrendPoint {
  month: string
  count: number
  amount: number
}

export async function getSalesTrend(months = 6): Promise<SalesTrendPoint[]> {
  const params = new URLSearchParams({ months: String(months) })
  const res = await apiGet<MethodResponse<SalesTrendPoint[]>>(`${METHOD_PREFIX}.get_sales_trend?${params.toString()}`)
  return res.message
}

export interface SalesOrderProgressRow {
  sales_order_item: string
  sales_order: string
  item_code: string
  item_name: string
  ordered_qty: number
  customer_name: string
  transaction_date: string
  unassigned_qty: number
  extruding_qty: number
  cutting_qty: number
  packaging_qty: number
  shipping_qty: number
  shipped_qty: number
}

export async function getSalesOrderProgress(search?: string, limit = 50): Promise<SalesOrderProgressRow[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (search) params.set('search', search)
  const res = await apiGet<MethodResponse<SalesOrderProgressRow[]>>(
    `${METHOD_PREFIX}.get_sales_order_progress?${params.toString()}`,
  )
  return res.message
}
