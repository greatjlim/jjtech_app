# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe


@frappe.whitelist()
def list_users_by_role(role, search=None):
	conditions = ["hr.role = %(role)s"]
	values = {"role": role}
	if search:
		conditions.append("(u.full_name like %(search)s or u.name like %(search)s)")
		values["search"] = f"%{search}%"

	return frappe.db.sql(
		f"""
		select u.name, u.full_name, u.enabled
		from `tabHas Role` hr
		inner join `tabUser` u on u.name = hr.parent
		where {" and ".join(conditions)}
		order by u.full_name
		""",
		values,
		as_dict=True,
	)


@frappe.whitelist()
def list_assignable_users(role, search=None):
	conditions = [
		"u.user_type = 'System User'",
		"u.name not in (select parent from `tabHas Role` where role = %(role)s)",
	]
	values = {"role": role}
	if search:
		conditions.append("(u.full_name like %(search)s or u.name like %(search)s)")
		values["search"] = f"%{search}%"

	return frappe.db.sql(
		f"""
		select u.name, u.full_name
		from `tabUser` u
		where {" and ".join(conditions)}
		order by u.full_name
		limit 50
		""",
		values,
		as_dict=True,
	)


@frappe.whitelist()
def add_role_to_user(user, role):
	doc = frappe.get_doc("User", user)
	if not any(r.role == role for r in doc.roles):
		doc.append("roles", {"role": role})
		doc.save()
	return "ok"


@frappe.whitelist()
def remove_role_from_user(user, role):
	doc = frappe.get_doc("User", user)
	doc.roles = [r for r in doc.roles if r.role != role]
	doc.save()
	return "ok"
