# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt


@frappe.whitelist()
def list_receivable_po_items(search=None):
	conditions = ["po.docstatus = 1", "poi.qty > 0"]
	values = {}
	if search:
		conditions.append(
			"(po.supplier_name like %(search)s or po.name like %(search)s "
			"or poi.item_name like %(search)s or poi.item_code like %(search)s)"
		)
		values["search"] = f"%{search}%"

	rows = frappe.db.sql(
		f"""
		select
			poi.name as purchase_order_item,
			poi.parent as purchase_order,
			poi.item_code,
			poi.item_name,
			poi.qty as order_qty,
			poi.rate,
			poi.schedule_date,
			po.supplier,
			po.supplier_name,
			po.transaction_date
		from `tabPurchase Order Item` poi
		inner join `tabPurchase Order` po on po.name = poi.parent
		where {" and ".join(conditions)}
		order by po.transaction_date desc
		""",
		values,
		as_dict=True,
	)
	if not rows:
		return []

	po_item_names = [r.purchase_order_item for r in rows]
	received_map = {}
	received_rows = frappe.db.sql(
		"""
		select pri.purchase_order_item, sum(pri.qty) as received
		from `tabPurchase Receipt Item` pri
		inner join `tabPurchase Receipt` pr on pr.name = pri.parent
		where pr.docstatus = 1 and pri.purchase_order_item in %(names)s
		group by pri.purchase_order_item
		""",
		{"names": po_item_names},
		as_dict=True,
	)
	for r in received_rows:
		received_map[r.purchase_order_item] = flt(r.received)

	result = []
	for row in rows:
		received = received_map.get(row.purchase_order_item, 0)
		remaining = flt(row.order_qty) - received
		if remaining <= 0:
			continue
		row["received_qty"] = received
		row["remaining_qty"] = remaining
		result.append(row)
	return result
