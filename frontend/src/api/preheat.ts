import { apiGet, apiPost } from './client'

export interface PreheatEligibleWorkOrder {
  name: string
  custom_mold: string | null
  qty: number
  expected_delivery_date: string | null
  sales_order: string | null
  customer_name: string | null
}

export interface AvailableMold {
  name: string
  mold_number: string
  mold_model: string
}

export interface ZoneJob {
  name: string
  work_order: string
  mold: string
  mold_number: string | null
  material: string | null
  weight: number | null
  check_in_time: string
  customer_name: string | null
}

export type ZoneBoard = Record<'1' | '2' | '3' | '0', ZoneJob[]>

interface MethodResponse<T> {
  message: T
}

const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.kiosk_api'

export async function listPreheatEligibleWorkOrders(workstation: string): Promise<PreheatEligibleWorkOrder[]> {
  const res = await apiGet<MethodResponse<PreheatEligibleWorkOrder[]>>(
    `${METHOD_PREFIX}.list_preheat_eligible_work_orders?workstation=${encodeURIComponent(workstation)}`,
  )
  return res.message
}

export async function listAvailableMolds(moldModel: string): Promise<AvailableMold[]> {
  const res = await apiGet<MethodResponse<AvailableMold[]>>(
    `${METHOD_PREFIX}.list_available_molds?mold_model=${encodeURIComponent(moldModel)}`,
  )
  return res.message
}

export async function getZoneBoard(workstation: string): Promise<ZoneBoard> {
  const res = await apiGet<MethodResponse<ZoneBoard>>(
    `${METHOD_PREFIX}.get_zone_board?workstation=${encodeURIComponent(workstation)}`,
  )
  return res.message
}

export async function registerPreheat(
  workOrder: string,
  workstation: string,
  mold: string,
  zone: '1' | '2' | '3',
): Promise<ZoneJob> {
  const res = await apiPost<MethodResponse<ZoneJob>>(`${METHOD_PREFIX}.register_preheat`, {
    work_order: workOrder,
    workstation,
    mold,
    zone,
  })
  return res.message
}

export async function checkoutMold(name: string): Promise<ZoneJob> {
  const res = await apiPost<MethodResponse<ZoneJob>>(`${METHOD_PREFIX}.checkout_mold`, { name })
  return res.message
}

export async function changeZone(name: string, newZone: '1' | '2' | '3'): Promise<ZoneJob> {
  const res = await apiPost<MethodResponse<ZoneJob>>(`${METHOD_PREFIX}.change_zone`, { name, new_zone: newZone })
  return res.message
}

export async function cancelPreheat(name: string): Promise<void> {
  await apiPost(`${METHOD_PREFIX}.cancel_preheat`, { name })
}
