# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

AVAILABLE_STATUS = "보관중"
IN_USE_STATUS = "사용중"


class MoldPreheatJob(Document):
	def validate(self):
		self.validate_work_order()
		self.validate_mold_model()
		if self.is_new():
			self.reserve_mold()

	def validate_work_order(self):
		wo = frappe.get_doc("Work Order", self.work_order)
		if wo.docstatus != 1:
			frappe.throw(_("작업지시 {0}이(가) 제출되지 않았습니다.").format(self.work_order))
		if wo.status in ("Cancelled", "Closed", "Stopped"):
			frappe.throw(_("작업지시 {0}은(는) {1} 상태라 예열할 수 없습니다.").format(self.work_order, wo.status))
		if wo.get("custom_workstation") != self.workstation:
			frappe.throw(_("작업지시 {0}은(는) {1} 호기가 아닙니다.").format(self.work_order, self.workstation))

	def validate_mold_model(self):
		wo_mold_model = frappe.db.get_value("Work Order", self.work_order, "custom_mold")
		mold_model = frappe.db.get_value("Mold", self.mold, "mold_model")
		if wo_mold_model and mold_model != wo_mold_model:
			frappe.throw(_("금형 {0}은(는) 작업지시의 형번({1})과 일치하지 않습니다.").format(self.mold, wo_mold_model))

	def reserve_mold(self):
		current_status = frappe.db.get_value("Mold", self.mold, "current_status")
		if current_status != AVAILABLE_STATUS:
			frappe.throw(_("금형 {0}은(는) 사용 가능(보관중) 상태가 아닙니다.").format(self.mold))
		frappe.db.set_value("Mold", self.mold, "current_status", IN_USE_STATUS)

	def on_trash(self):
		frappe.db.set_value("Mold", self.mold, "current_status", AVAILABLE_STATUS)
