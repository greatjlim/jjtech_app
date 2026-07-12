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


def patch_gemini_model(*args, **kwargs):
	# changai의 clients.py가 MODEL_ID = "gemini-2.5-flash-lite"를 모듈 상수로
	# 하드코딩하는데, 신규 발급된 Gemini API 키에서는 이 모델이 더 이상 지원되지
	# 않는다(2026-07 확인, Google 쪽 정책 변경 — "no longer available to new
	# users" 에러). changai 소스를 직접 고치면 deploy/setup-changai.sh로 재클론할
	# 때 사라지므로 hooks.py의 before_request로 모듈 상수를 매 요청마다 교체한다.
	#
	# 처음엔 on_session_creation(로그인 시점)에 걸었는데, gunicorn 워커가
	# 여러 개라 로그인 요청을 받은 워커만 패치되고 다른 워커는 미패치 상태로
	# 남는 문제가 있었다(라운드로빈으로 채팅 요청이 그쪽으로 갈 수 있음).
	# before_request는 모든 요청마다 도니 어느 워커가 처리하든 패치가 보장된다.
	#
	# 부팅 초기(site 컨텍스트 생성 전)에 patch하면 changai의 schema_utils.py가
	# 모듈 최상단에서 frappe.utils.get_url()을 호출해 frappe.local.conf가 없어서
	# 실패하므로, 반드시 site 컨텍스트가 보장되는 요청 처리 중에 해야 한다.
	try:
		from changai.changai.api.v2 import clients as _changai_clients
	except Exception:
		return
	_changai_clients.MODEL_ID = "gemini-2.5-flash"
