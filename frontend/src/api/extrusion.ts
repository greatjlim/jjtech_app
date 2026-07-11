import { apiGet, apiPost } from './client'

export interface ExtrusionRecipe {
  mold: string
  mold_model: string
  cutting_method: string | null
  billet_length: number | null
  billet_qty: number | null
  extrusion_length: number | null
  pieces_per_billet: number | null
  target_qty: number
}

export interface ExtrusionQueueItem {
  name: string
  qty: number
  sales_order: string | null
  customer_name: string | null
  extrusion_status: '진행중' | '완료' | null
}

export interface ExtrusionJob {
  name: string
  work_order: string
  workstation: string
  mold: string
  shift: string
  start_time: string
  end_time: string | null
  status: string
  cut_length_1: number
  cut_qty_1: number
  cut_length_2: number
  cut_qty_2: number
  cut_length_3: number
  cut_qty_3: number
  cut_length_4: number
  cut_qty_4: number
  cut_length_5: number
  cut_qty_5: number
}

interface MethodResponse<T> {
  message: T
}

const METHOD_PREFIX = '/method/jjtech_app.jjtech_app.kiosk_api'

export async function getExtrusionRecipe(mold: string): Promise<ExtrusionRecipe> {
  const res = await apiGet<MethodResponse<ExtrusionRecipe>>(`${METHOD_PREFIX}.get_extrusion_recipe?mold=${encodeURIComponent(mold)}`)
  return res.message
}

export async function listExtrusionQueue(mold: string): Promise<ExtrusionQueueItem[]> {
  const res = await apiGet<MethodResponse<ExtrusionQueueItem[]>>(
    `${METHOD_PREFIX}.list_extrusion_queue?mold=${encodeURIComponent(mold)}`,
  )
  return res.message
}

const JOB_FIELDS = [
  'name',
  'work_order',
  'workstation',
  'mold',
  'shift',
  'start_time',
  'end_time',
  'status',
  'cut_length_1',
  'cut_qty_1',
  'cut_length_2',
  'cut_qty_2',
  'cut_length_3',
  'cut_qty_3',
  'cut_length_4',
  'cut_qty_4',
  'cut_length_5',
  'cut_qty_5',
]

export async function getInProgressExtrusionJob(workOrder: string): Promise<ExtrusionJob | null> {
  const params = new URLSearchParams({
    filters: JSON.stringify([
      ['work_order', '=', workOrder],
      ['status', '=', '진행중'],
    ]),
    fields: JSON.stringify(JOB_FIELDS),
    limit_page_length: '1',
  })
  const res = await apiGet<{ data: ExtrusionJob[] }>(`/resource/Extrusion%20Job?${params.toString()}`)
  return res.data[0] ?? null
}

export async function startExtrusion(
  workOrder: string,
  workstation: string,
  mold: string,
  shift: '주간' | '야간',
): Promise<ExtrusionJob> {
  const res = await apiPost<MethodResponse<ExtrusionJob>>(`${METHOD_PREFIX}.start_extrusion`, {
    work_order: workOrder,
    workstation,
    mold,
    shift,
  })
  return res.message
}

export interface CutPair {
  length: number | null
  qty: number | null
}

export async function completeExtrusion(name: string, cuts: CutPair[]): Promise<ExtrusionJob> {
  const body: Record<string, unknown> = { name }
  cuts.slice(0, 5).forEach((cut, idx) => {
    body[`cut_length_${idx + 1}`] = cut.length ?? undefined
    body[`cut_qty_${idx + 1}`] = cut.qty ?? undefined
  })
  const res = await apiPost<MethodResponse<ExtrusionJob>>(`${METHOD_PREFIX}.complete_extrusion`, body)
  return res.message
}
