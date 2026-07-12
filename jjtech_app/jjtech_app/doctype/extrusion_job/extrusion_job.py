# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

IN_USE_STATUS = "사용중"


class ExtrusionJob(Document):
	def validate(self):
		self.validate_work_order()
		self.validate_mold_model()
		self.validate_duplicate_in_progress()
		if self.status == "완료":
			self.validate_cut_values()
		if self.is_new():
			self.validate_preheat_exists()

	def validate_work_order(self):
		wo = frappe.get_doc("Work Order", self.work_order)
		if wo.docstatus != 1:
			frappe.throw(_("작업지시 {0}이(가) 제출되지 않았습니다.").format(self.work_order))
		if wo.status in ("Cancelled", "Closed", "Stopped"):
			frappe.throw(_("작업지시 {0}은(는) {1} 상태라 진행할 수 없습니다.").format(self.work_order, wo.status))
		if wo.get("custom_workstation") != self.workstation:
			frappe.throw(_("작업지시 {0}은(는) {1} 호기가 아닙니다.").format(self.work_order, self.workstation))

	def validate_mold_model(self):
		wo_mold_model = frappe.db.get_value("Work Order", self.work_order, "custom_mold")
		if not wo_mold_model:
			frappe.throw(_("작업지시 {0}에 형번이 지정되어 있지 않습니다.").format(self.work_order))
		mold_model = frappe.db.get_value("Mold", self.mold, "mold_model")
		if mold_model != wo_mold_model:
			frappe.throw(_("금형 {0}은(는) 작업지시의 형번({1})과 일치하지 않습니다.").format(self.mold, wo_mold_model))

	def validate_duplicate_in_progress(self):
		if self.status != "진행중":
			return
		existing = frappe.db.exists(
			"Extrusion Job",
			{
				"work_order": self.work_order,
				"status": "진행중",
				"name": ["!=", self.name or ""],
			},
		)
		if existing:
			frappe.throw(_("이미 진행 중인 압출작업이 있습니다 ({0}).").format(existing))

	def validate_cut_values(self):
		if not self.cut_length_1:
			frappe.throw(_("절단길이1이 입력되지 않았습니다."))
		if not self.cut_qty_1:
			frappe.throw(_("절단수량1이 입력되지 않았습니다."))

	def validate_preheat_exists(self):
		exists = frappe.db.exists("Mold Preheat Job", {"mold": self.mold, "workstation": self.workstation})
		if not exists:
			frappe.throw(_("금형 {0}이(가) 이 호기의 예열 Zone 보드에 없습니다.").format(self.mold))

	def after_insert(self):
		# 압출을 시작하는 순간 그 금형의 예열 기록은 정리된다(원본: "금형예열은 자동으로
		# 완료처리합니다"). on_trash의 "보관중으로 반납" 부작용은 여기서는 원치 않으므로
		# (창고로 돌아간 게 아니라 다음 공정으로 넘어간 것) 훅을 우회하는 raw delete를 쓴다.
		frappe.db.delete("Mold Preheat Job", {"mold": self.mold, "workstation": self.workstation})
		frappe.db.set_value("Mold", self.mold, "current_status", IN_USE_STATUS)
