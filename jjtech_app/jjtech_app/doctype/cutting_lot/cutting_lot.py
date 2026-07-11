# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class CuttingLot(Document):
	def validate(self):
		self.validate_work_order()
		self.validate_extrusion_job()
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

	def calculate_cut_weight(self):
		mold = frappe.db.get_value("Extrusion Job", self.extrusion_job, "mold")
		mold_model = frappe.db.get_value("Mold", mold, "mold_model") if mold else None
		unit_weight = frappe.db.get_value("Mold Model", mold_model, "unit_weight") if mold_model else None
		if unit_weight and self.cut_length and self.cut_qty:
			self.cut_weight = round(unit_weight * self.cut_length / 1000 * self.cut_qty, 2)
