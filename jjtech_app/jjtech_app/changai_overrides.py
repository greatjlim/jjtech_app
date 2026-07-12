# Copyright (c) 2026, JJtech and contributors
# For license information, please see license.txt

import frappe


@frappe.whitelist(allow_guest=False)
def check_file_updates(file_name: str):
	# changai(github.com/ERPGulf/changai)의 check_file_updates에는 원본에
	# @frappe.whitelist()가 빠져있어 Desk의 ChangAI Settings 화면에서 호출하면
	# "not whitelisted" 에러가 난다. changai는 우리 저장소가 아니라 로컬에 클론해서
	# 쓰는 외부 앱(deploy/setup-changai.sh로 재클론됨)이라 그 소스를 직접 고치면
	# 재클론할 때마다 사라진다. hooks.py의 override_whitelisted_methods로 이
	# 래퍼를 대신 노출하고, 실제 로직은 원본 함수를 그대로 호출한다.
	from changai.changai.api.v2.schema_utils import check_file_updates as _check_file_updates

	return _check_file_updates(file_name)
