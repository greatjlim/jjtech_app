# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class Packaging(Document):
	def validate(self):
		self.validate_work_order()
		self.validate_cutting_lot()
		self.validate_bad_qty()
		self.validate_not_over_packed()

	def validate_work_order(self):
		wo = frappe.get_doc("Work Order", self.work_order)
		if wo.docstatus != 1:
			frappe.throw(_("작업지시 {0}이(가) 제출되지 않았습니다.").format(self.work_order))
		if wo.status in ("Cancelled", "Closed", "Stopped"):
			frappe.throw(_("작업지시 {0}은(는) {1} 상태라 진행할 수 없습니다.").format(self.work_order, wo.status))
		if wo.get("custom_workstation") != self.workstation:
			frappe.throw(_("작업지시 {0}은(는) {1} 호기가 아닙니다.").format(self.work_order, self.workstation))

	def validate_cutting_lot(self):
		lot = frappe.get_doc("Cutting Lot", self.cutting_lot)
		if lot.work_order != self.work_order:
			frappe.throw(_("절단파렛트 {0}은(는) 이 작업지시의 기록이 아닙니다.").format(self.cutting_lot))
		if lot.status != "정상":
			frappe.throw(_("절단파렛트 {0}은(는) 포장할 수 없는 상태입니다({1}).").format(self.cutting_lot, lot.status))

	def validate_bad_qty(self):
		if self.bad_qty and not self.bad_code:
			frappe.throw(_("불량유형을 입력하세요."))

	def validate_not_over_packed(self):
		cut_qty = frappe.db.get_value("Cutting Lot", self.cutting_lot, "cut_qty") or 0
		packed_so_far = (
			frappe.db.sql(
				"""select sum(pack_qty) from `tabPackaging`
				where cutting_lot=%s and name!=%s""",
				(self.cutting_lot, self.name or ""),
			)[0][0]
			or 0
		)
		total = packed_so_far + (self.pack_qty or 0) + (self.bad_qty or 0)
		if total > cut_qty:
			frappe.throw(
				_("포장수량+불량수량 합계({0})가 절단수량({1})을 초과합니다(이미 포장됨 {2}).").format(
					(self.pack_qty or 0) + (self.bad_qty or 0), cut_qty, packed_so_far
				)
			)
