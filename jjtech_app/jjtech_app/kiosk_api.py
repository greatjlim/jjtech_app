# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import now_datetime

STAGE_ORDER = ["금형예열", "압출작업", "절단작업"]


def _get_current_work_order(workstation):
	rows = frappe.get_all(
		"Work Order",
		filters={
			"custom_workstation": workstation,
			"docstatus": 1,
			"status": ["not in", ["Completed", "Stopped", "Closed", "Cancelled"]],
		},
		fields=["name", "production_item", "item_name", "qty"],
		order_by="creation asc",
		limit=1,
	)
	return rows[0] if rows else None


def _get_logs(work_order):
	return frappe.get_all(
		"Process Log",
		filters={"work_order": work_order},
		fields=["name", "process_type", "status", "start_time", "end_time", "qty"],
		order_by="creation asc",
	)


@frappe.whitelist()
def get_machine_status(workstation):
	wo = _get_current_work_order(workstation)
	if not wo:
		return {
			"workstation": workstation,
			"work_order": None,
			"current_stage": None,
			"stage_status": "no_work_order",
			"available": dict.fromkeys(STAGE_ORDER, False),
			"reasons": dict.fromkeys(STAGE_ORDER, "작업지시 대기중"),
			"logs": [],
		}

	logs = _get_logs(wo.name)
	completed = {row.process_type for row in logs if row.status == "완료"}
	in_progress_stage = next((row.process_type for row in logs if row.status == "진행중"), None)

	available = {}
	reasons = {}
	for idx, stage in enumerate(STAGE_ORDER):
		if in_progress_stage:
			available[stage] = False
			reasons[stage] = "진행중" if stage == in_progress_stage else "다른 공정 진행 중"
			continue
		if stage in completed:
			available[stage] = False
			reasons[stage] = "이미 완료됨"
			continue
		if idx == 0:
			available[stage] = True
			reasons[stage] = ""
		else:
			prior = STAGE_ORDER[idx - 1]
			if prior in completed:
				available[stage] = True
				reasons[stage] = ""
			else:
				available[stage] = False
				reasons[stage] = f"{prior} 완료 후 가능"

	if in_progress_stage:
		stage_status = "in_progress"
	elif len(completed) == len(STAGE_ORDER):
		stage_status = "done"
	else:
		stage_status = "idle"

	return {
		"workstation": workstation,
		"work_order": wo.name,
		"production_item": wo.production_item,
		"item_name": wo.item_name,
		"qty": wo.qty,
		"current_stage": in_progress_stage,
		"stage_status": stage_status,
		"available": available,
		"reasons": reasons,
		"logs": logs,
	}


@frappe.whitelist()
def start_process(workstation, process_type, mold=None, zone=None):
	if process_type not in STAGE_ORDER:
		frappe.throw(_("알 수 없는 공정입니다: {0}").format(process_type))

	wo = _get_current_work_order(workstation)
	if not wo:
		frappe.throw(_("{0}에 진행 가능한 작업지시가 없습니다.").format(workstation))

	doc = frappe.get_doc(
		{
			"doctype": "Process Log",
			"work_order": wo.name,
			"process_type": process_type,
			"workstation": workstation,
			"mold": mold or None,
			"zone": zone or None,
			"start_time": now_datetime(),
			"status": "진행중",
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def complete_process(process_log, qty=None):
	doc = frappe.get_doc("Process Log", process_log)
	if doc.status == "완료":
		frappe.throw(_("이미 완료된 기록입니다."))
	doc.end_time = now_datetime()
	if qty is not None:
		doc.qty = qty
	doc.status = "완료"
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()
