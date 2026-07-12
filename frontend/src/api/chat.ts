import { apiPost } from './client'

// changAI는 jjtech_app/ERPNext와 같은 사이트에 정석대로 설치돼 있다(bench install-app).
// 별도 컨테이너로 분리하려 했으나, changAI 자체가 로그인마다 무거운 RAG 스택을
// 무조건 import하는 구조라 분리해도 실익이 없어 포기했다 — 그냥 /api로 호출한다.
const PIPELINE_METHOD = 'changai.changai.api.v2.text2sql_pipeline_v2.run_text2sql_pipeline'

export interface ChatPipelineResult {
  Bot?: string
  SQL?: string
  Fields?: string
  Tables?: string[]
  EntityDebug?: unknown
  [key: string]: unknown
}

interface MethodResponse<T> {
  message: T
}

function randomId(): string {
  return crypto.randomUUID()
}

export async function runChatQuery(userQuestion: string, chatId: string): Promise<ChatPipelineResult> {
  const res = await apiPost<MethodResponse<ChatPipelineResult>>(`/method/${PIPELINE_METHOD}`, {
    user_question: userQuestion,
    chat_id: chatId,
    request_id: randomId(),
    sendNonErptoAI: false,
  })
  return res.message
}

export function newChatId(): string {
  return randomId()
}
