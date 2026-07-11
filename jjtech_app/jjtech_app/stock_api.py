# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe


@frappe.whitelist()
def list_stock_status(search=None, warehouse=None, only_in_stock=False, offset=0, limit=100):
	conditions = ["1=1"]
	values = {}
	if search:
		conditions.append("(b.item_code like %(search)s or i.item_name like %(search)s or b.warehouse like %(search)s)")
		values["search"] = f"%{search}%"
	if warehouse:
		conditions.append("b.warehouse = %(warehouse)s")
		values["warehouse"] = warehouse
	if frappe.utils.cint(only_in_stock):
		conditions.append("b.actual_qty > 0")

	where_clause = " and ".join(conditions)

	total = frappe.db.sql(
		f"""
		select count(*)
		from `tabBin` b
		inner join `tabItem` i on i.name = b.item_code
		where {where_clause}
		""",
		values,
	)[0][0]

	rows = frappe.db.sql(
		f"""
		select
			b.item_code,
			i.item_name,
			i.item_group,
			b.warehouse,
			b.actual_qty,
			b.reserved_qty,
			b.projected_qty,
			b.valuation_rate,
			b.stock_value
		from `tabBin` b
		inner join `tabItem` i on i.name = b.item_code
		where {where_clause}
		order by i.item_name asc, b.warehouse asc
		limit %(limit)s offset %(offset)s
		""",
		{**values, "limit": frappe.utils.cint(limit), "offset": frappe.utils.cint(offset)},
		as_dict=True,
	)
	return {"items": rows, "total": total}


@frappe.whitelist()
def list_stock_ledger(item_code, warehouse, offset=0, limit=100):
	filters = {"item_code": item_code, "warehouse": warehouse, "is_cancelled": 0}
	total = frappe.db.count("Stock Ledger Entry", filters=filters)
	rows = frappe.get_all(
		"Stock Ledger Entry",
		filters=filters,
		fields=[
			"name",
			"posting_date",
			"posting_time",
			"voucher_type",
			"voucher_no",
			"actual_qty",
			"qty_after_transaction",
			"incoming_rate",
			"valuation_rate",
			"stock_value",
		],
		order_by="posting_date desc, posting_time desc, creation desc",
		limit_start=frappe.utils.cint(offset),
		limit_page_length=frappe.utils.cint(limit),
	)
	return {"items": rows, "total": total}
