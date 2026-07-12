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

	# 작업지시 배정수량 — Work Order.sales_order_item으로 직접 묶는다(reqd 강제됨, Part B).
	assigned_rows = frappe.db.sql(
		"""
		select sales_order_item, sum(qty - process_loss_qty) as qty
		from `tabWork Order`
		where docstatus = 1 and status != 'Closed' and sales_order_item in %(names)s
		group by sales_order_item
		""",
		{"names": so_item_names},
		as_dict=True,
	)
	assigned_map = {r.sales_order_item: flt(r.qty) for r in assigned_rows}

	# 압출·절단·포장은 sales_order_item을 직접 갖고 있지 않으므로 work_order를 거쳐 묶는다
	# (별도 필드로 복제하지 않고 그때그때 join — 이유는 Context 참고).
	extruded_rows = frappe.db.sql(
		"""
		select wo.sales_order_item,
			sum(coalesce(ej.cut_qty_1,0)+coalesce(ej.cut_qty_2,0)+coalesce(ej.cut_qty_3,0)
				+coalesce(ej.cut_qty_4,0)+coalesce(ej.cut_qty_5,0)) as qty
		from `tabExtrusion Job` ej
		inner join `tabWork Order` wo on wo.name = ej.work_order
		where ej.status = '완료' and wo.sales_order_item in %(names)s
		group by wo.sales_order_item
		""",
		{"names": so_item_names},
		as_dict=True,
	)
	extruded_map = {r.sales_order_item: flt(r.qty) for r in extruded_rows}

	cut_rows = frappe.db.sql(
		"""
		select wo.sales_order_item, sum(cl.cut_qty) as qty
		from `tabCutting Lot` cl
		inner join `tabWork Order` wo on wo.name = cl.work_order
		where cl.status != '폐기' and wo.sales_order_item in %(names)s
		group by wo.sales_order_item
		""",
		{"names": so_item_names},
		as_dict=True,
	)
	cut_map = {r.sales_order_item: flt(r.qty) for r in cut_rows}

	packed_rows = frappe.db.sql(
		"""
		select wo.sales_order_item, sum(coalesce(pk.pack_qty,0)+coalesce(pk.bad_qty,0)) as qty
		from `tabPackaging` pk
		inner join `tabWork Order` wo on wo.name = pk.work_order
		where wo.sales_order_item in %(names)s
		group by wo.sales_order_item
		""",
		{"names": so_item_names},
		as_dict=True,
	)
	packed_map = {r.sales_order_item: flt(r.qty) for r in packed_rows}

	shipped_rows = frappe.db.sql(
		"""
		select shi.sales_order_item, sum(shi.ship_qty) as qty
		from `tabShipment Item` shi
		inner join `tabShipment` sh on sh.name = shi.parent
		where sh.docstatus = 1 and shi.sales_order_item in %(names)s
		group by shi.sales_order_item
		""",
		{"names": so_item_names},
		as_dict=True,
	)
	shipped_map = {r.sales_order_item: flt(r.qty) for r in shipped_rows}

	result = []
	for row in rows:
		key = row.sales_order_item
		ordered = flt(row.ordered_qty)
		assigned = min(assigned_map.get(key, 0), ordered)
		extruded = min(extruded_map.get(key, 0), assigned)
		cut = min(cut_map.get(key, 0), extruded)
		packed = min(packed_map.get(key, 0), cut)
		shipped = min(shipped_map.get(key, 0), packed)

		row["unassigned_qty"] = ordered - assigned
		row["extruding_qty"] = assigned - extruded
		row["cutting_qty"] = extruded - cut
		row["packaging_qty"] = cut - packed
		row["shipping_qty"] = packed - shipped
		row["shipped_qty"] = shipped
		result.append(row)
	return result
