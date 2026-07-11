import { apiGet, apiPost } from './client'

export interface ProcessLogEntry {
  name: string
  process_type: string
  status: string
  start_time: string
  end_time: string | null
  qty: number
}

export interface MachineStatus {
  workstation: string
  work_order: string | null
  production_item?: string
  item_name?: string
  qty?: number
  current_stage: string | null
  stage_status: 'no_work_order' | 'idle' | 'in_progress' | 'done'
  available: Record<string, boolean>
  reasons: Record<string, string>
  logs: ProcessLogEntry[]
}

export interface ProcessLogDoc {
  name: string
  work_order: string
  process_type: string
  workstation: string
  mold: string | null
  zone: string | null
  start_time: string
  end_time: string | null
  qty: number
  status: string
}

interface MethodResponse<T> {
  message: T
}

export async function getMachineStatus(workstation: string): Promise<MachineStatus> {
  const res = await apiGet<MethodResponse<MachineStatus>>(
    `/method/jjtech_app.jjtech_app.kiosk_api.get_machine_status?workstation=${encodeURIComponent(workstation)}`,
  )
  return res.message
}

export async function startProcess(
  workstation: string,
  processType: string,
  mold?: string,
  zone?: string,
): Promise<ProcessLogDoc> {
  const res = await apiPost<MethodResponse<ProcessLogDoc>>('/method/jjtech_app.jjtech_app.kiosk_api.start_process', {
    workstation,
    process_type: processType,
    mold,
    zone,
  })
  return res.message
}

export async function completeProcess(processLog: string, qty?: number): Promise<ProcessLogDoc> {
  const res = await apiPost<MethodResponse<ProcessLogDoc>>('/method/jjtech_app.jjtech_app.kiosk_api.complete_process', {
    process_log: processLog,
    qty,
  })
  return res.message
}
