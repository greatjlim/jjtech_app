import { apiGet, apiPost } from './client'

export interface PackagingQueueItem {
  cutting_lot: string
  work_order: string
  pallet_no: string | null
  mold_model: string | null
  customer_name: string | null
  spec: string | null
  color: string | null
  material: string | null
  heat_treatment: string | null
  cut_length: number
  cut_qty: number
  packed_so_far: number
  remaining: number
}

export interface PackagingHistoryItem {
  name: string
  work_order: string
  cutting_lot: string
  pack_qty: number
  bad_qty: number
  bad_code: string | null
  creation: string
  pallet_no: string | null
  mold_model: string | null
}

export interface PackagingDoc {
  name: string
  work_order: string
  workstation: string
  cutting_lot: string
  shift: string
  job_time: string
  pack_qty: number
  bad_qty: number
  bad_code: string | null
  remark: string | null
}

interface MethodResponse<T> {
  message: T
}

const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.kiosk_api'

export async function listPackagingQueue(workstation: string): Promise<PackagingQueueItem[]> {
  const res = await apiGet<MethodResponse<PackagingQueueItem[]>>(
    `${METHOD_PREFIX}.list_packaging_queue?workstation=${encodeURIComponent(workstation)}`,
  )
  return res.message
}

export async function listPackagingHistory(workstation: string, date: string): Promise<PackagingHistoryItem[]> {
  const res = await apiGet<MethodResponse<PackagingHistoryItem[]>>(
    `${METHOD_PREFIX}.list_packaging_history?workstation=${encodeURIComponent(workstation)}&date=${encodeURIComponent(date)}`,
  )
  return res.message
}

export interface RegisterPackagingInput {
  cuttingLot: string
  workOrder: string
  workstation: string
  packQty: number
  shift: '주간' | '야간'
  badQty?: number
  badCode?: string
  jobTime?: string
}

export async function registerPackaging(input: RegisterPackagingInput): Promise<PackagingDoc> {
  const res = await apiPost<MethodResponse<PackagingDoc>>(`${METHOD_PREFIX}.register_packaging`, {
    cutting_lot: input.cuttingLot,
    work_order: input.workOrder,
    workstation: input.workstation,
    pack_qty: input.packQty,
    shift: input.shift,
    bad_qty: input.badQty ?? 0,
    bad_code: input.badCode || undefined,
    job_time: input.jobTime || undefined,
  })
  return res.message
}

export async function deletePackaging(name: string): Promise<void> {
  await apiPost(`${METHOD_PREFIX}.delete_packaging`, { name })
}
