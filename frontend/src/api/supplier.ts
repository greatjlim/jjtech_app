import { apiDelete, apiGet, apiPost, apiPut } from './client'

export interface SupplierDoc {
  name: string
  supplier_name: string
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
  supplier_details: string | null
  disabled: 0 | 1
}

export interface SupplierFormState {
  supplier_name: string
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
  supplier_details: string
  useOrNot: 'Y' | 'N'
}

export function emptySupplierForm(): SupplierFormState {
  return {
    supplier_name: '',
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
    supplier_details: '',
    useOrNot: 'Y',
  }
}

export function supplierDocToForm(doc: SupplierDoc): SupplierFormState {
  return {
    supplier_name: doc.supplier_name ?? '',
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
    supplier_details: doc.supplier_details ?? '',
    useOrNot: doc.disabled ? 'N' : 'Y',
  }
}

const LIST_FIELDS = [
  'name',
  'supplier_name',
  'custom_representative_name',
  'tax_id',
  'custom_phone_number',
  'custom_address_main',
]

export interface SupplierListItem {
  name: string
  supplier_name: string
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

export async function listSuppliers(
  search: string,
  offset: number,
  limit: number,
): Promise<{ items: SupplierListItem[]; total: number }> {
  const filters = search ? [['supplier_name', 'like', `%${search}%`]] : []

  const listParams = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_start: String(offset),
    limit_page_length: String(limit),
    order_by: 'supplier_name asc',
  })
  const countParams = new URLSearchParams({ doctype: 'Supplier' })
  if (filters.length) {
    listParams.set('filters', JSON.stringify(filters))
    countParams.set('filters', JSON.stringify(filters))
  }

  const [listRes, countRes] = await Promise.all([
    apiGet<ListResponse<SupplierListItem>>(`/resource/Supplier?${listParams.toString()}`),
    apiGet<CountResponse>(`/method/frappe.client.get_count?${countParams.toString()}`),
  ])

  return { items: listRes.data, total: countRes.message }
}

interface DocResponse<T> {
  data: T
}

export async function getSupplier(name: string): Promise<SupplierDoc> {
  const res = await apiGet<DocResponse<SupplierDoc>>(`/resource/Supplier/${encodeURIComponent(name)}`)
  return res.data
}

export type SupplierUpdatePayload = Partial<Omit<SupplierDoc, 'name' | 'supplier_name'>>

export function formToUpdatePayload(form: SupplierFormState): SupplierUpdatePayload {
  return {
    custom_company_shorten_name: form.custom_company_shorten_name,
    tax_id: form.tax_id,
    custom_phone_number: form.custom_phone_number,
    custom_mobile_phone_number: form.custom_mobile_phone_number,
    custom_email: form.custom_email,
    custom_address_main: form.custom_address_main,
    custom_address_detail: form.custom_address_detail,
    custom_zip_code: form.custom_zip_code,
    custom_representative_name: form.custom_representative_name,
    website: form.website,
    custom_tax_invoice_name: form.custom_tax_invoice_name,
    custom_tax_invoice_department: form.custom_tax_invoice_department,
    custom_tax_invoice_position: form.custom_tax_invoice_position,
    custom_tax_invoice_mobile: form.custom_tax_invoice_mobile,
    custom_tax_invoice_email: form.custom_tax_invoice_email,
    supplier_details: form.supplier_details,
    disabled: form.useOrNot === 'N' ? 1 : 0,
  }
}

export async function updateSupplier(name: string, patch: SupplierUpdatePayload): Promise<SupplierDoc> {
  const res = await apiPut<DocResponse<SupplierDoc>>(`/resource/Supplier/${encodeURIComponent(name)}`, patch)
  return res.data
}

export interface SupplierCreatePayload extends SupplierUpdatePayload {
  supplier_name: string
  supplier_type: string
  supplier_group: string
}

// supplier_type/supplier_group은 화면에 노출하지 않고 항상 이 값으로 고정 전송한다
// (Sales Order의 company/currency 하드코딩과 동일한 패턴).
export function formToCreatePayload(form: SupplierFormState): SupplierCreatePayload {
  return {
    supplier_name: form.supplier_name,
    supplier_type: 'Company',
    supplier_group: 'Raw Material',
    ...formToUpdatePayload(form),
  }
}

export async function createSupplier(patch: SupplierCreatePayload): Promise<SupplierDoc> {
  const res = await apiPost<DocResponse<SupplierDoc>>('/resource/Supplier', patch)
  return res.data
}

export async function deleteSupplier(name: string): Promise<void> {
  await apiDelete(`/resource/Supplier/${encodeURIComponent(name)}`)
}
