# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt, get_first_day, get_last_day, nowdate


@frappe.whitelist()
def get_kpi_summary():
	today = nowdate()
	month_start = get_first_day(today)
	month_end = get_last_day(today)

	so_draft = frappe.db.count("Sales Order", {"docstatus": 0})
	so_open = frappe.db.count(
		"Sales Order", {"docstatus": 1, "status": ["not in", ["Closed", "Completed", "Cancelled"]]}
	)
	so_this_month = frappe.db.count(
		"Sales Order", {"docstatus": 1, "transaction_date": ["between", [month_start, month_end]]}
	)

	wo_rows = frappe.db.sql(
		"""
		select status, count(*) as count
		from `tabWork Order`
		where docstatus = 1
		group by status
		""",
		as_dict=True,
	)

	shipment_row = frappe.db.sql(
		"""
		select count(*) as count, coalesce(sum(total_ship_weight), 0) as weight
		from `tabShipment`
		where docstatus = 1 and shipment_date between %(start)s and %(end)s
		""",
		{"start": month_start, "end": month_end},
		as_dict=True,
	)[0]

	po_pending = frappe.db.count(
		"Purchase Order", {"docstatus": 1, "status": ["in", ["To Receive", "To Receive and Bill"]]}
	)

	bin_row = frappe.db.sql(
		"""
		select count(*) as item_count, sum(case when actual_qty <= 0 then 1 else 0 end) as zero_stock_count
		from `tabBin`
		""",
		as_dict=True,
	)[0]

	return {
		"sales_order": {"draft": so_draft, "open": so_open, "this_month_count": so_this_month},
		"work_order": [{"status": r.status, "count": r.count} for r in wo_rows],
		"shipment": {"this_month_count": shipment_row.count, "this_month_weight": flt(shipment_row.weight)},
		"purchase_order": {"pending_receipt_count": po_pending},
		"stock": {
			"item_count": bin_row.item_count or 0,
			"zero_stock_count": bin_row.zero_stock_count or 0,
		},
	}


@frappe.whitelist()
def get_sales_trend(months=6):
	months = int(months)
	rows = frappe.db.sql(
		"""
		select
			date_format(transaction_date, '%%Y-%%m') as month,
			count(*) as count,
			coalesce(sum(grand_total), 0) as amount
		from `tabSales Order`
		where docstatus = 1 and transaction_date >= date_sub(curdate(), interval %(months)s month)
		group by month
		order by month asc
		""",
		{"months": months},
		as_dict=True,
	)
	return [{"month": r.month, "count": r.count, "amount": flt(r.amount)} for r in rows]


@frappe.whitelist()
def get_sales_order_progress(search=None, limit=50):
	conditions = ["so.docstatus = 1", "so.status not in ('Closed', 'Cancelled')"]
	values = {"limit": int(limit)}
	if search:
		conditions.append("(so.name like %(search)s or so.customer_name like %(search)s or soi.item_name like %(search)s)")
		values["search"] = f"%{search}%"

	rows = frappe.db.sql(
		f"""
		select
			soi.name as sales_order_item,
			soi.parent as sales_order,
			soi.item_code,
			soi.item_name,
			soi.qty as ordered_qty,
			so.customer_name,
			so.transaction_date
		from `tabSales Order Item` soi
		inner join `tabSales Order` so on so.name = soi.parent
		where {" and ".join(conditions)}
		order by so.transaction_date desc
		limit %(limit)s
		""",
		values,
		as_dict=True,
	)
	if not rows:
		return []

	so_item_names = [r.sales_order_item for r in rows]

	assigned_rows = frappe.db.sql(
		"""
		select sales_order_item, sum(qty - process_loss_qty) as assigned_qty
		from `tabWork Order`
		where docstatus = 1 and status != 'Closed' and sales_order_item in %(names)s
		group by sales_order_item
		""",
		{"names": so_item_names},
		as_dict=True,
	)
	assigned_map = {r.sales_order_item: flt(r.assigned_qty) for r in assigned_rows}

	shipped_rows = frappe.db.sql(
		"""
		select shi.sales_order_item, sum(shi.ship_qty) as shipped_qty
		from `tabShipment Item` shi
		inner join `tabShipment` sh on sh.name = shi.parent
		where sh.docstatus = 1 and shi.sales_order_item in %(names)s
		group by shi.sales_order_item
		""",
		{"names": so_item_names},
		as_dict=True,
	)
	shipped_map = {r.sales_order_item: flt(r.shipped_qty) for r in shipped_rows}

	result = []
	for row in rows:
		ordered = flt(row.ordered_qty)
		assigned = min(assigned_map.get(row.sales_order_item, 0), ordered)
		shipped = min(shipped_map.get(row.sales_order_item, 0), assigned)
		row["assigned_qty"] = assigned
		row["shipped_qty"] = shipped
		row["unassigned_qty"] = ordered - assigned
		row["in_production_qty"] = assigned - shipped
		result.append(row)
	return result
