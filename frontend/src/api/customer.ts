import { apiGet } from './client'

export interface CustomerDoc {
  name: string
  customer_name: string
  custom_company_shorten_name: string | null
  tax_id: string | null
  custom_phone_number: string | null
  custom_mobile_phone_number: string | null
  custom_email: string | null
  custom_address_main: string | null
  custom_address_detail: string | null
  custom_zip_code: string | null
  custom_representative_name: string | null
  website: string | null
  custom_tax_invoice_name: string | null
  custom_tax_invoice_department: string | null
  custom_tax_invoice_position: string | null
  custom_tax_invoice_mobile: string | null
  custom_tax_invoice_email: string | null
  customer_details: string | null
  disabled: 0 | 1
}

export interface CustomerFormState {
  customer_name: string
  custom_company_shorten_name: string
  tax_id: string
  custom_phone_number: string
  custom_mobile_phone_number: string
  custom_email: string
  custom_address_main: string
  custom_address_detail: string
  custom_zip_code: string
  custom_representative_name: string
  website: string
  custom_tax_invoice_name: string
  custom_tax_invoice_department: string
  custom_tax_invoice_position: string
  custom_tax_invoice_mobile: string
  custom_tax_invoice_email: string
  customer_details: string
  useOrNot: 'Y' | 'N'
}

export function emptyCustomerForm(): CustomerFormState {
  return {
    customer_name: '',
    custom_company_shorten_name: '',
    tax_id: '',
    custom_phone_number: '',
    custom_mobile_phone_number: '',
    custom_email: '',
    custom_address_main: '',
    custom_address_detail: '',
    custom_zip_code: '',
    custom_representative_name: '',
    website: '',
    custom_tax_invoice_name: '',
    custom_tax_invoice_department: '',
    custom_tax_invoice_position: '',
    custom_tax_invoice_mobile: '',
    custom_tax_invoice_email: '',
    customer_details: '',
    useOrNot: 'Y',
  }
}

export function customerDocToForm(doc: CustomerDoc): CustomerFormState {
  return {
    customer_name: doc.customer_name ?? '',
    custom_company_shorten_name: doc.custom_company_shorten_name ?? '',
    tax_id: doc.tax_id ?? '',
    custom_phone_number: doc.custom_phone_number ?? '',
    custom_mobile_phone_number: doc.custom_mobile_phone_number ?? '',
    custom_email: doc.custom_email ?? '',
    custom_address_main: doc.custom_address_main ?? '',
    custom_address_detail: doc.custom_address_detail ?? '',
    custom_zip_code: doc.custom_zip_code ?? '',
    custom_representative_name: doc.custom_representative_name ?? '',
    website: doc.website ?? '',
    custom_tax_invoice_name: doc.custom_tax_invoice_name ?? '',
    custom_tax_invoice_department: doc.custom_tax_invoice_department ?? '',
    custom_tax_invoice_position: doc.custom_tax_invoice_position ?? '',
    custom_tax_invoice_mobile: doc.custom_tax_invoice_mobile ?? '',
    custom_tax_invoice_email: doc.custom_tax_invoice_email ?? '',
    customer_details: doc.customer_details ?? '',
    useOrNot: doc.disabled ? 'N' : 'Y',
  }
}

const LIST_FIELDS = [
  'name',
  'customer_name',
  'custom_representative_name',
  'tax_id',
  'custom_phone_number',
  'custom_address_main',
]

export interface CustomerListItem {
  name: string
  customer_name: string
  custom_representative_name: string | null
  tax_id: string | null
  custom_phone_number: string | null
  custom_address_main: string | null
}

interface ListResponse<T> {
  data: T[]
}

interface CountResponse {
  message: number
}

export async function listCustomers(
  search: string,
  offset: number,
  limit: number,
): Promise<{ items: CustomerListItem[]; total: number }> {
  const filters = search ? [['customer_name', 'like', `%${search}%`]] : []

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'customer_name asc',
  })
  const countParams = new URLSearchParams({ doctype: 'Customer' })
  if (filters.length) {
    listParams.set('filters', JSON.stringify(filters))
    countParams.set('filters', JSON.stringify(filters))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<CustomerListItem>>(`/resource/Customer?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

interface DocResponse<T> {
  data: T
}

export async function getCustomer(name: string): Promise<CustomerDoc> {
  const res = await apiGet<DocResponse<CustomerDoc>>(`/resource/Customer/${encodeURIComponent(name)}`)
  return res.data
}
