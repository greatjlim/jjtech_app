# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class Shipment(Document):
	def validate(self):
		self.validate_lines()
		self.calculate_total_weight()

	def validate_lines(self):
		for row in self.items:
			if flt(row.ship_qty) <= 0:
				frappe.throw(_("{0}행: 출고수량은 0보다 커야 합니다.").format(row.idx))
			if row.sales_order_item:
				self.validate_against_sales_order_item(row)
			if row.packaging:
				self.validate_against_packaging(row)

	def validate_against_sales_order_item(self, row):
		order_qty = frappe.db.get_value("Sales Order Item", row.sales_order_item, "qty") or 0
		shipped_so_far = flt(
			frappe.db.sql(
				"""select sum(si.ship_qty) from `tabShipment Item` si
				inner join `tabShipment` s on s.name = si.parent
				where si.sales_order_item=%s and s.docstatus=1 and si.parent!=%s""",
				(row.sales_order_item, self.name or ""),
			)[0][0]
			or 0
		)
		total = shipped_so_far + flt(row.ship_qty)
		if total > order_qty:
			frappe.throw(
				_("{0}행: 출고수량 합계({1})가 주문수량({2})을 초과합니다(기출고 {3}).").format(
					row.idx, total, order_qty, shipped_so_far
				)
			)
		row.order_qty = order_qty

	def validate_against_packaging(self, row):
		pack_qty = frappe.db.get_value("Packaging", row.packaging, "pack_qty") or 0
		shipped_so_far = flt(
			frappe.db.sql(
				"""select sum(si.ship_qty) from `tabShipment Item` si
				inner join `tabShipment` s on s.name = si.parent
				where si.packaging=%s and s.docstatus=1 and si.parent!=%s""",
				(row.packaging, self.name or ""),
			)[0][0]
			or 0
		)
		total = shipped_so_far + flt(row.ship_qty)
		if total > pack_qty:
			frappe.throw(
				_("{0}행: 출고수량 합계({1})가 포장수량({2})을 초과합니다(기출고 {3}).").format(
					row.idx, total, pack_qty, shipped_so_far
				)
			)

	def calculate_total_weight(self):
		self.total_ship_weight = sum(flt(row.ship_weight) for row in self.items)

	def on_submit(self):
		self.create_delivery_notes()

	def create_delivery_notes(self):
		default_warehouse = frappe.db.get_single_value("Stock Settings", "default_warehouse")

		groups: dict[str, list] = {}
		for row in self.items:
			groups.setdefault(row.customer, []).append(row)

		for customer, rows in groups.items():
			dn = frappe.new_doc("Delivery Note")
			dn.customer = customer
			dn.company = "JJtech"
			dn.posting_date = self.shipment_date
			dn.set_warehouse = default_warehouse
			for row in rows:
				dn.append(
					"items",
					{
						"item_code": row.item_code,
						"qty": row.ship_qty,
						"warehouse": default_warehouse,
						"against_sales_order": row.sales_order or None,
						"so_detail": row.sales_order_item or None,
					},
				)
			dn.insert(ignore_permissions=True)
			dn.submit()

			for row, dn_item in zip(rows, dn.items):
				row.db_set("delivery_note", dn.name, update_modified=False)
				row.db_set("delivery_note_item", dn_item.name, update_modified=False)

	def on_cancel(self):
		dn_names = {row.delivery_note for row in self.items if row.delivery_note}
		for dn_name in dn_names:
			dn = frappe.get_doc("Delivery Note", dn_name)
			if dn.docstatus == 1:
				dn.cancel()
