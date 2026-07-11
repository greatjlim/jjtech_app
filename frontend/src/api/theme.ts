import { apiGet, apiPut } from './client'

export type DeskTheme = 'Light' | 'Dark' | 'Automatic'

interface DocResponse<T> {
  data: T
}

export async function getMyTheme(user: string): Promise<DeskTheme> {
  const params = new URLSearchParams({ fields: JSON.stringify(['desk_theme']) })
  const res = await apiGet<DocResponse<{ desk_theme: DeskTheme | null }>>(
    `/resource/User/${encodeURIComponent(user)}?${params.toString()}`,
  )
  return res.data.desk_theme || 'Light'
}

export async function setMyTheme(user: string, theme: DeskTheme): Promise<void> {
  await apiPut(`/resource/User/${encodeURIComponent(user)}`, { desk_theme: theme })
}
