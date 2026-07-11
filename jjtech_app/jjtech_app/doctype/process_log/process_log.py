# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

STAGE_ORDER = ["금형예열", "압출작업", "절단작업"]


class ProcessLog(Document):
	def validate(self):
		self.validate_work_order()
		self.validate_sequence()
		self.validate_duplicate_in_progress()
		self.validate_not_already_completed()

	def validate_work_order(self):
		wo = frappe.get_doc("Work Order", self.work_order)
		if wo.docstatus != 1:
			frappe.throw(_("작업지시 {0}이(가) 제출되지 않았습니다.").format(self.work_order))
		if wo.status in ("Cancelled", "Closed", "Stopped"):
			frappe.throw(_("작업지시 {0}은(는) {1} 상태라 진행할 수 없습니다.").format(self.work_order, wo.status))
		if wo.get("custom_workstation") != self.workstation:
			frappe.throw(_("작업지시 {0}은(는) {1} 호기가 아닙니다.").format(self.work_order, self.workstation))

	def validate_sequence(self):
		if self.process_type == STAGE_ORDER[0]:
			return
		prior_stage = STAGE_ORDER[STAGE_ORDER.index(self.process_type) - 1]
		completed = frappe.db.exists(
			"Process Log",
			{
				"work_order": self.work_order,
				"process_type": prior_stage,
				"status": "완료",
				"name": ["!=", self.name or ""],
			},
		)
		if not completed:
			frappe.throw(_("{0}을(를) 시작하려면 먼저 {1}이(가) 완료되어야 합니다.").format(self.process_type, prior_stage))

	def validate_duplicate_in_progress(self):
		if self.status != "진행중":
			return
		existing = frappe.db.exists(
			"Process Log",
			{
				"work_order": self.work_order,
				"process_type": self.process_type,
				"status": "진행중",
				"name": ["!=", self.name or ""],
			},
		)
		if existing:
			frappe.throw(_("이미 진행 중인 {0} 기록이 있습니다 ({1}).").format(self.process_type, existing))

	def validate_not_already_completed(self):
		completed = frappe.db.exists(
			"Process Log",
			{
				"work_order": self.work_order,
				"process_type": self.process_type,
				"status": "완료",
				"name": ["!=", self.name or ""],
			},
		)
		if completed:
			frappe.throw(_("{0}은(는) 이미 완료되었습니다 ({1}).").format(self.process_type, completed))
