# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import json

import frappe
import frappe.permissions

DOCTYPE = "Jjtech App Screen Permission"


@frappe.whitelist()
def get_role_screen_permission(role):
	name = frappe.db.exists(DOCTYPE, {"role": role})
	if not name:
		return {"restricted": False, "screens": []}
	screens = frappe.db.get_value(DOCTYPE, name, "screens") or "[]"
	return {"restricted": True, "screens": json.loads(screens)}


@frappe.whitelist()
def set_role_screen_permission(role, screens):
	if isinstance(screens, str):
		screens = json.loads(screens)
	name = frappe.db.exists(DOCTYPE, {"role": role})
	if name:
		doc = frappe.get_doc(DOCTYPE, name)
	else:
		doc = frappe.new_doc(DOCTYPE)
		doc.role = role
	doc.screens = json.dumps(screens)
	doc.save()
	return "ok"


@frappe.whitelist()
def clear_role_screen_permission(role):
	name = frappe.db.exists(DOCTYPE, {"role": role})
	if name:
		frappe.delete_doc(DOCTYPE, name)
	return "ok"


@frappe.whitelist()
def get_my_allowed_screens():
	user = frappe.session.user
	# frappe.get_roles()(top-level 헬퍼)는 with_standard 옵션이 없어서 모든
	# 시스템 사용자에게 자동으로 붙는 All/Guest/Desk User/Administrator
	# (AUTOMATIC_ROLES)까지 항상 같이 돌려준다. 이 자동 역할들은 아무도
	# 화면권한을 설정하지 않으므로, 걸러내지 않으면 "설정 안 된 역할이
	# 하나라도 있으면 전체허용" 규칙에 항상 걸려서 실제 부여한 역할의
	# 제한이 전부 무력화된다. frappe.permissions.get_roles(with_standard=False)를
	# 직접 써서 순수하게 부여받은 역할만 본다.
	roles = frappe.permissions.get_roles(user, with_standard=False)
	if user == "Administrator" or "System Manager" in frappe.get_roles(user):
		return {"all": True, "screens": []}

	if not roles:
		return {"all": True, "screens": []}

	allowed = set()
	for role in roles:
		name = frappe.db.exists(DOCTYPE, {"role": role})
		if not name:
			return {"all": True, "screens": []}
		screens = frappe.db.get_value(DOCTYPE, name, "screens") or "[]"
		allowed.update(json.loads(screens))
	return {"all": False, "screens": list(allowed)}
