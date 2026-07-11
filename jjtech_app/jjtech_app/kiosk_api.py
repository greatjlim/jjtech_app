# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import now_datetime

STAGE_ORDER = ["절단작업"]


def _is_fully_cycled(work_order):
	return frappe.db.exists(
		"Process Log",
		{
			"work_order": work_order,
			"process_type": STAGE_ORDER[-1],
			"status": "완료",
		},
	)


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
	)
	for row in rows:
		if not _is_fully_cycled(row.name):
			return row
	return None


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
			extrusion_done = frappe.db.exists("Extrusion Job", {"work_order": wo.name, "status": "완료"})
			if extrusion_done:
				available[stage] = True
				reasons[stage] = ""
			else:
				available[stage] = False
				reasons[stage] = "압출작업 완료 후 가능"
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


# 금형예열 (Zone 기반 다중 동시 예열 + 대출)

PREHEAT_ZONES = ["1", "2", "3"]
LOAN_ZONE = "0"


@frappe.whitelist()
def list_preheat_eligible_work_orders(workstation):
	rows = frappe.get_all(
		"Work Order",
		filters={
			"custom_workstation": workstation,
			"docstatus": 1,
			"status": ["not in", ["Completed", "Stopped", "Closed", "Cancelled"]],
		},
		fields=["name", "custom_mold", "qty", "expected_delivery_date", "sales_order", "creation"],
		order_by="creation asc",
	)

	sales_orders = {row.sales_order for row in rows if row.sales_order}
	customer_names = {}
	if sales_orders:
		for so in frappe.get_all("Sales Order", filters={"name": ["in", list(sales_orders)]}, fields=["name", "customer_name"]):
			customer_names[so.name] = so.customer_name

	for row in rows:
		row["customer_name"] = customer_names.get(row.sales_order)

	return rows


@frappe.whitelist()
def list_available_molds(mold_model):
	return frappe.get_all(
		"Mold",
		filters={"mold_model": mold_model, "current_status": "보관중"},
		fields=["name", "mold_number", "mold_model"],
		order_by="mold_number asc",
	)


def _enrich_zone_job(job):
	mold = frappe.db.get_value("Mold", job.mold, ["mold_number", "mold_model"], as_dict=True) or {}
	mold_model_info = {}
	if mold.get("mold_model"):
		mold_model_info = (
			frappe.db.get_value(
				"Mold Model", mold["mold_model"], ["texture_heat_treatment", "unit_weight"], as_dict=True
			)
			or {}
		)
	customer_name = None
	sales_order = frappe.db.get_value("Work Order", job.work_order, "sales_order")
	if sales_order:
		customer_name = frappe.db.get_value("Sales Order", sales_order, "customer_name")

	return {
		"name": job.name,
		"work_order": job.work_order,
		"mold": job.mold,
		"mold_number": mold.get("mold_number"),
		"material": mold_model_info.get("texture_heat_treatment"),
		"weight": mold_model_info.get("unit_weight"),
		"check_in_time": job.check_in_time,
		"customer_name": customer_name,
	}


@frappe.whitelist()
def get_zone_board(workstation):
	jobs = frappe.get_all(
		"Mold Preheat Job",
		filters={"workstation": workstation},
		fields=["name", "work_order", "mold", "zone", "check_in_time"],
		order_by="check_in_time asc",
	)

	board = {"1": [], "2": [], "3": [], "0": []}
	for job in jobs:
		board[job.zone].append(_enrich_zone_job(job))
	return board


@frappe.whitelist()
def register_preheat(work_order, workstation, mold, zone):
	if zone not in PREHEAT_ZONES:
		frappe.throw(_("Zone은 1/2/3 중에서만 고를 수 있습니다."))

	doc = frappe.get_doc(
		{
			"doctype": "Mold Preheat Job",
			"work_order": work_order,
			"workstation": workstation,
			"mold": mold,
			"zone": zone,
			"check_in_time": now_datetime(),
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def checkout_mold(name):
	doc = frappe.get_doc("Mold Preheat Job", name)
	if doc.zone == LOAN_ZONE:
		frappe.throw(_("이미 대출된 금형입니다."))
	doc.zone = LOAN_ZONE
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def change_zone(name, new_zone):
	if new_zone not in PREHEAT_ZONES:
		frappe.throw(_("Zone은 1/2/3 중에서만 고를 수 있습니다."))
	doc = frappe.get_doc("Mold Preheat Job", name)
	doc.zone = new_zone
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def cancel_preheat(name):
	frappe.delete_doc("Mold Preheat Job", name, ignore_permissions=True)
	frappe.db.commit()


# 압출작업 (같은 형번을 쓰는 작업지시 대기열 + 절단길이/수량 기록)

RECIPE_FIELDS = ["cutting_method", "billet_length", "billet_qty", "extrusion_length", "pieces_per_billet"]


def _extrusion_queue_filters(mold_model):
	return {
		"custom_mold": mold_model,
		"docstatus": 1,
		"status": ["not in", ["Completed", "Stopped", "Closed", "Cancelled"]],
	}


@frappe.whitelist()
def get_extrusion_recipe(mold):
	mold_doc = frappe.db.get_value("Mold", mold, ["mold_model", "mold_number", "hole_count"], as_dict=True)
	if not mold_doc or not mold_doc.mold_model:
		frappe.throw(_("금형 {0}의 형번을 찾을 수 없습니다.").format(mold))

	mold_model = mold_doc.mold_model
	recipe = (
		frappe.db.get_value("Mold Model", mold_model, RECIPE_FIELDS + ["unit_weight", "drawing_image"], as_dict=True) or {}
	)
	target_qty = (
		frappe.db.sql(
			"""select sum(qty) from `tabWork Order`
			where custom_mold=%s and docstatus=1 and status not in ('Completed','Stopped','Closed','Cancelled')""",
			(mold_model,),
		)[0][0]
		or 0
	)

	return {
		"mold": mold,
		"mold_number": mold_doc.mold_number,
		"hole_count": mold_doc.hole_count,
		"mold_model": mold_model,
		**recipe,
		"target_qty": target_qty,
	}


@frappe.whitelist()
def list_extrusion_queue(mold):
	mold_model = frappe.db.get_value("Mold", mold, "mold_model")
	if not mold_model:
		return []

	rows = frappe.get_all(
		"Work Order",
		filters=_extrusion_queue_filters(mold_model),
		fields=["name", "qty", "sales_order", "sales_order_item"],
		order_by="creation asc",
	)

	sales_orders = {row.sales_order for row in rows if row.sales_order}
	customer_names = {}
	if sales_orders:
		for so in frappe.get_all("Sales Order", filters={"name": ["in", list(sales_orders)]}, fields=["name", "customer_name"]):
			customer_names[so.name] = so.customer_name

	line_names = {row.sales_order_item for row in rows if row.sales_order_item}
	line_info = {}
	if line_names:
		for line in frappe.get_all(
			"Sales Order Item",
			filters={"name": ["in", list(line_names)]},
			fields=["name", "custom_order_spec", "custom_color", "custom_material", "custom_heat_treatment", "custom_order_weight"],
		):
			line_info[line.name] = line

	for row in rows:
		row["customer_name"] = customer_names.get(row.sales_order)
		line = line_info.get(row.sales_order_item, {})
		row["spec"] = line.get("custom_order_spec")
		row["color"] = line.get("custom_color")
		row["material"] = line.get("custom_material")
		row["heat_treatment"] = line.get("custom_heat_treatment")
		row["weight"] = line.get("custom_order_weight")
		job = frappe.get_all(
			"Extrusion Job",
			filters={"work_order": row.name},
			fields=["status"],
			order_by="creation desc",
			limit=1,
		)
		row["extrusion_status"] = job[0].status if job else None

	return rows


@frappe.whitelist()
def start_extrusion(work_order, workstation, mold, shift):
	doc = frappe.get_doc(
		{
			"doctype": "Extrusion Job",
			"work_order": work_order,
			"workstation": workstation,
			"mold": mold,
			"shift": shift,
			"start_time": now_datetime(),
			"status": "진행중",
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def complete_extrusion(
	name,
	cut_length_1,
	cut_qty_1,
	cut_length_2=None,
	cut_qty_2=None,
	cut_length_3=None,
	cut_qty_3=None,
	cut_length_4=None,
	cut_qty_4=None,
	cut_length_5=None,
	cut_qty_5=None,
):
	doc = frappe.get_doc("Extrusion Job", name)
	if doc.status == "완료":
		frappe.throw(_("이미 완료된 압출작업입니다."))
	doc.end_time = now_datetime()
	doc.cut_length_1 = cut_length_1
	doc.cut_qty_1 = cut_qty_1
	doc.cut_length_2 = cut_length_2
	doc.cut_qty_2 = cut_qty_2
	doc.cut_length_3 = cut_length_3
	doc.cut_qty_3 = cut_qty_3
	doc.cut_length_4 = cut_length_4
	doc.cut_qty_4 = cut_qty_4
	doc.cut_length_5 = cut_length_5
	doc.cut_qty_5 = cut_qty_5
	doc.status = "완료"
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()
