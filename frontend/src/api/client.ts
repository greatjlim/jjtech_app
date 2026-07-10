const BASE = '/api'

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  })

  const contentType = res.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await res.json() : undefined

  if (!res.ok) {
    const message =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?._server_messages) && data._server_messages[0]) ||
      res.statusText
    throw new ApiError(message, res.status, data)
  }

  return data as T
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export function apiPostForm<T>(path: string, form: Record<string, string>): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form),
  })
}

let csrfTokenCache: string | null = null

// Frappe는 CSRF 토큰을 전용 API로 내려주지 않고 desk HTML에 `frappe.csrf_token = "...";`로
// 심어둔다. 로그인된 세션으로 그 HTML을 한 번 받아 정규식으로 뽑아 캐싱한다.
async function fetchCsrfToken(): Promise<string | null> {
  const res = await fetch('/desk', { credentials: 'include' })
  const html = await res.text()
  const match = html.match(/frappe\.csrf_token\s*=\s*"([^"]*)"/)
  return match?.[1] || null
}

async function getCsrfToken(): Promise<string | null> {
  if (!csrfTokenCache) {
    csrfTokenCache = await fetchCsrfToken()
  }
  return csrfTokenCache
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const token = await getCsrfToken()
  return request<T>(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Frappe-CSRF-Token': token } : {}),
    },
    body: JSON.stringify(body),
  })
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getCsrfToken()
  return request<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Frappe-CSRF-Token': token } : {}),
    },
    body: JSON.stringify(body),
  })
}

export async function uploadFile(file: File): Promise<string> {
  const token = await getCsrfToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('is_private', '0')
  const res = await request<{ message: { file_url: string } }>('/method/upload_file', {
    method: 'POST',
    headers: token ? { 'X-Frappe-CSRF-Token': token } : {},
    body: formData,
  })
  return res.message.file_url
}

export async function apiDelete<T>(path: string): Promise<T> {
  const token = await getCsrfToken()
  return request<T>(path, {
    method: 'DELETE',
    headers: {
      ...(token ? { 'X-Frappe-CSRF-Token': token } : {}),
    },
  })
}
