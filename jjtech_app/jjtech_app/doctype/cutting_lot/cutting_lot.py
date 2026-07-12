# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class CuttingLot(Document):
	def validate(self):
		self.validate_work_order()
		self.validate_extrusion_job()
		self.validate_not_over_extruded()
		self.calculate_cut_weight()

	def validate_work_order(self):
		wo = frappe.get_doc("Work Order", self.work_order)
		if wo.docstatus != 1:
			frappe.throw(_("작업지시 {0}이(가) 제출되지 않았습니다.").format(self.work_order))
		if wo.status in ("Cancelled", "Closed", "Stopped"):
			frappe.throw(_("작업지시 {0}은(는) {1} 상태라 진행할 수 없습니다.").format(self.work_order, wo.status))
		if wo.get("custom_workstation") != self.workstation:
			frappe.throw(_("작업지시 {0}은(는) {1} 호기가 아닙니다.").format(self.work_order, self.workstation))

	def validate_extrusion_job(self):
		job = frappe.get_doc("Extrusion Job", self.extrusion_job)
		if job.work_order != self.work_order:
			frappe.throw(_("압출작업 {0}은(는) 이 작업지시의 기록이 아닙니다.").format(self.extrusion_job))
		if job.status != "완료":
			frappe.throw(_("압출작업 {0}이(가) 아직 완료되지 않았습니다.").format(self.extrusion_job))

	def validate_not_over_extruded(self):
		job = frappe.get_doc("Extrusion Job", self.extrusion_job)
		extruded_qty = sum(job.get(f"cut_qty_{i}") or 0 for i in range(1, 6))
		cut_so_far = (
			frappe.db.sql(
				"""select sum(cut_qty) from `tabCutting Lot`
				where extrusion_job=%s and name!=%s and status != '폐기'""",
				(self.extrusion_job, self.name or ""),
			)[0][0]
			or 0
		)
		total = cut_so_far + (self.cut_qty or 0)
		if total > extruded_qty:
			frappe.throw(
				_("절단수량 합계({0})가 압출작업의 생산수량({1})을 초과합니다(이미 절단됨 {2}).").format(
					total, extruded_qty, cut_so_far
				)
			)

	def calculate_cut_weight(self):
		mold = frappe.db.get_value("Extrusion Job", self.extrusion_job, "mold")
		mold_model = frappe.db.get_value("Mold", mold, "mold_model") if mold else None
		unit_weight = frappe.db.get_value("Mold Model", mold_model, "unit_weight") if mold_model else None
		if unit_weight and self.cut_length and self.cut_qty:
			self.cut_weight = round(unit_weight * self.cut_length / 1000 * self.cut_qty, 2)
