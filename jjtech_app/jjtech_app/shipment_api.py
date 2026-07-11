# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt


@frappe.whitelist()
def list_shippable_sales_order_items(search=None):
	conditions = ["so.docstatus = 1", "soi.qty > 0"]
	values = {}
	if search:
		conditions.append(
			"(so.customer_name like %(search)s or so.name like %(search)s "
			"or soi.item_name like %(search)s or soi.item_code like %(search)s)"
		)
		values["search"] = f"%{search}%"

	rows = frappe.db.sql(
		f"""
		select
			soi.name as sales_order_item,
			soi.parent as sales_order,
			soi.item_code,
			soi.item_name,
			soi.qty as order_qty,
			soi.custom_mold as mold_model,
			soi.custom_order_spec as spec,
			soi.custom_color as color,
			soi.custom_material as material,
			soi.custom_heat_treatment as heat_treatment,
			soi.custom_order_weight as order_weight,
			so.customer,
			so.customer_name,
			so.transaction_date
		from `tabSales Order Item` soi
		inner join `tabSales Order` so on so.name = soi.parent
		where {" and ".join(conditions)}
		order by so.transaction_date desc
		""",
		values,
		as_dict=True,
	)
	if not rows:
		return []

	shipped_map = _shipped_qty_map("sales_order_item", [r.sales_order_item for r in rows])

	result = []
	for row in rows:
		shipped = shipped_map.get(row.sales_order_item, 0)
		remaining = flt(row.order_qty) - shipped
		if remaining <= 0:
			continue
		row["shipped_qty"] = shipped
		row["remaining_qty"] = remaining
		result.append(row)
	return result


@frappe.whitelist()
def list_shippable_packagings(search=None):
	conditions = ["1=1"]
	values = {}
	if search:
		conditions.append(
			"(so.customer_name like %(search)s or p.name like %(search)s "
			"or soi.item_name like %(search)s or soi.item_code like %(search)s)"
		)
		values["search"] = f"%{search}%"

	rows = frappe.db.sql(
		f"""
		select
			p.name as packaging,
			p.pack_qty,
			p.work_order,
			wo.custom_mold as mold_model,
			wo.sales_order,
			wo.sales_order_item,
			soi.item_code,
			soi.item_name,
			soi.custom_order_spec as spec,
			soi.custom_color as color,
			soi.custom_material as material,
			soi.custom_heat_treatment as heat_treatment,
			so.customer,
			so.customer_name
		from `tabPackaging` p
		inner join `tabWork Order` wo on wo.name = p.work_order
		left join `tabSales Order Item` soi on soi.name = wo.sales_order_item
		left join `tabSales Order` so on so.name = wo.sales_order
		where {" and ".join(conditions)}
		order by p.creation desc
		""",
		values,
		as_dict=True,
	)
	if not rows:
		return []

	shipped_map = _shipped_qty_map("packaging", [r.packaging for r in rows])

	result = []
	for row in rows:
		shipped = shipped_map.get(row.packaging, 0)
		remaining = flt(row.pack_qty) - shipped
		if remaining <= 0:
			continue
		row["shipped_qty"] = shipped
		row["remaining_qty"] = remaining
		result.append(row)
	return result


def _shipped_qty_map(fieldname, names):
	if not names:
		return {}
	rows = frappe.db.sql(
		f"""
		select si.{fieldname} as ref, sum(si.ship_qty) as shipped
		from `tabShipment Item` si
		inner join `tabShipment` s on s.name = si.parent
		where s.docstatus = 1 and si.{fieldname} in %(names)s
		group by si.{fieldname}
		""",
		{"names": names},
		as_dict=True,
	)
	return {r.ref: flt(r.shipped) for r in rows}
