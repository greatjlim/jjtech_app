import { apiGet, apiPost } from './client'

export interface CuttingQueueItem {
  work_order: string
  mold_model: string | null
  customer_name: string | null
  spec: string | null
  color: string | null
  material: string | null
  heat_treatment: string | null
  qty: number
  weight: number | null
  cutting_status: '진행중' | null
}

export interface CuttingInfo {
  work_order: string
  mold_model: string | null
  drawing_image: string | null
}

export interface PalletInput {
  pallet_no: string
  cut_length: number | null
  cut_qty: number | null
  sample_length: number | null
  sample_weight: number | null
}

export interface RegisterCuttingResult {
  cutting_lots: string[]
  process_log: string
  total_qty: number
}

interface MethodResponse<T> {
  message: T
}

const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.kiosk_api'

export async function listCuttingQueue(workstation: string): Promise<CuttingQueueItem[]> {
  const res = await apiGet<MethodResponse<CuttingQueueItem[]>>(
    `${METHOD_PREFIX}.list_cutting_queue?workstation=${encodeURIComponent(workstation)}`,
  )
  return res.message
}

export async function startCutting(workOrder: string, workstation: string): Promise<void> {
  await apiPost(`${METHOD_PREFIX}.start_cutting`, { work_order: workOrder, workstation })
}

export async function getCuttingInfo(workOrder: string): Promise<CuttingInfo> {
  const res = await apiGet<MethodResponse<CuttingInfo>>(`${METHOD_PREFIX}.get_cutting_info?work_order=${encodeURIComponent(workOrder)}`)
  return res.message
}

export async function registerCutting(workOrder: string, workstation: string, pallets: PalletInput[]): Promise<RegisterCuttingResult> {
  const res = await apiPost<MethodResponse<RegisterCuttingResult>>(`${METHOD_PREFIX}.register_cutting`, {
    work_order: workOrder,
    workstation,
    pallets: JSON.stringify(pallets),
  })
  return res.message
}
