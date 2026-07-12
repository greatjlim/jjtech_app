import { apiDelete, apiGet, apiPut } from './client'

const LIST_FIELDS = ['name', 'company_name', 'abbr', 'tax_id', 'phone_no', 'country']

export interface CompanyListItem {
  name: string
  company_name: string
  abbr: string
  tax_id: string | null
  phone_no: string | null
  country: string | null
}

export interface CompanyDoc {
  name: string
  company_name: string
  abbr: string
  tax_id: string | null
  phone_no: string | null
  fax: string | null
  email: string | null
  website: string | null
  country: string | null
  default_currency: string | null
  is_group: 0 | 1
  parent_company: string | null
}

export type CompanyUpdatePayload = Partial<Omit<CompanyDoc, 'name' | 'company_name'>>

interface ListResponse<T> {
  data: T[]
}

interface DocResponse<T> {
  data: T
}

export async function listCompanies(search: string): Promise<CompanyListItem[]> {
  const params = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_page_length: '0',
    order_by: 'company_name asc',
  })
  if (search) {
    params.set('filters', JSON.stringify([['company_name', 'like', `%${search}%`]]))
  }
  const res = await apiGet<ListResponse<CompanyListItem>>(`/resource/Company?${params.toString()}`)
  return res.data
}

export async function getCompany(name: string): Promise<CompanyDoc> {
  const res = await apiGet<DocResponse<CompanyDoc>>(`/resource/Company/${encodeURIComponent(name)}`)
  return res.data
}

export async function updateCompany(name: string, patch: CompanyUpdatePayload): Promise<CompanyDoc> {
  const res = await apiPut<DocResponse<CompanyDoc>>(`/resource/Company/${encodeURIComponent(name)}`, patch)
  return res.data
}

export async function deleteCompany(name: string): Promise<void> {
  await apiDelete(`/resource/Company/${encodeURIComponent(name)}`)
}
