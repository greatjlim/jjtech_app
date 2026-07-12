app_name = "jjtech_app"
app_title = "Jjtech App"
app_publisher = "JJtech"
app_description = "Custom app for JJtech"
app_email = "greatjlim@gmail.com"
app_license = "mit"

# Fixtures
# ------------------
# Export customizations that belong to this app's module only, so installing
# jjtech_app on another site does not pull in unrelated Custom Fields /
# Property Setters / Scripts created by other apps.

fixtures = [
	{
		"doctype": "Custom Field",
		"filters": [["module", "=", "Jjtech App"]],
	},
	{
		"doctype": "Property Setter",
		"filters": [["module", "=", "Jjtech App"]],
	},
	{
		"doctype": "Client Script",
		"filters": [["module", "=", "Jjtech App"]],
	},
	{
		"doctype": "Server Script",
		"filters": [["module", "=", "Jjtech App"]],
	},
	{
		"doctype": "Role",
		"filters": [["name", "=", "Kiosk Worker"]],
	},
	{
		# role 필터가 아니라 parent(문서타입) 필터를 쓴다. Custom DocPerm이 문서타입에
		# 하나라도 생기면 Frappe는 그 문서타입의 표준 DocPerm을 전부 무시하고 Custom
		# DocPerm에 있는 것만 유효 권한으로 취급하므로(추가가 아니라 대체), Kiosk Worker
		# 권한을 얹으면서 같이 넣어준 원래 역할(Manufacturing User 등) 권한도 반드시 함께
		# export/커밋되어야 한다. role 필터로는 그 행들이 빠져서 fixture만으로는
		# 재현되지 않는 권한 회귀가 생긴다.
		"doctype": "Custom DocPerm",
		"filters": [["parent", "in", ["Work Order", "Workstation"]]],
	},
]

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "jjtech_app",
# 		"logo": "/assets/jjtech_app/logo.png",
# 		"title": "Jjtech App",
# 		"route": "/jjtech_app",
# 		"has_permission": "jjtech_app.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/jjtech_app/css/jjtech_app.css"
# app_include_js = "/assets/jjtech_app/js/jjtech_app.js"

# include js, css files in header of web template
# web_include_css = "/assets/jjtech_app/css/jjtech_app.css"
# web_include_js = "/assets/jjtech_app/js/jjtech_app.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "jjtech_app/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "jjtech_app/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "jjtech_app.utils.jinja_methods",
# 	"filters": "jjtech_app.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "jjtech_app.install.before_install"
# after_install = "jjtech_app.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "jjtech_app.uninstall.before_uninstall"
# after_uninstall = "jjtech_app.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "jjtech_app.utils.before_app_install"
# after_app_install = "jjtech_app.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "jjtech_app.utils.before_app_uninstall"
# after_app_uninstall = "jjtech_app.utils.after_app_uninstall"

# Build
# ------------------
# To hook into the build process

# after_build = "jjtech_app.build.after_build"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "jjtech_app.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Request Events
# --------------
# changai의 하드코딩된 Gemini 모델 상수를 패치한다 (자세한 사유는
# jjtech_app.jjtech_app.changai_overrides.patch_gemini_model 참고). 처음엔
# on_session_creation(로그인 시점)에 걸었는데, gunicorn 워커가 여러 개라
# 로그인 요청을 받은 워커만 패치되고 다른 워커는 그대로 남는 문제가 있었다
# (라운드로빈으로 채팅 요청이 미패치 워커에 갈 수 있음). 모든 요청마다 도는
# before_request로 옮겨서 어느 워커가 처리하든 확실히 패치되게 한다 (idempotent
# 하고 비용도 무시할 수준).
before_request = ["jjtech_app.jjtech_app.changai_overrides.patch_gemini_model"]

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"jjtech_app.tasks.all"
# 	],
# 	"daily": [
# 		"jjtech_app.tasks.daily"
# 	],
# 	"hourly": [
# 		"jjtech_app.tasks.hourly"
# 	],
# 	"weekly": [
# 		"jjtech_app.tasks.weekly"
# 	],
# 	"monthly": [
# 		"jjtech_app.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "jjtech_app.install.before_tests"

# Extend DocType Class
# ------------------------------
#
# Specify custom mixins to extend the standard doctype controller.
# extend_doctype_class = {
# 	"Task": "jjtech_app.custom.task.CustomTaskMixin"
# }

# Overriding Methods
# ------------------------------
#
# changai(외부 앱, apps/changai에 로컬 클론, git으로 우리가 관리하지 않음)의
# check_file_updates에 @frappe.whitelist()가 빠져있어 Desk의 ChangAI Settings
# 화면에서 호출하면 실패한다. changai 소스를 직접 고치면 deploy/setup-changai.sh로
# 재클론할 때 사라지므로, 여기서 우리 쪽 whitelisted 래퍼로 우회한다.
override_whitelisted_methods = {
	"changai.changai.api.v2.schema_utils.check_file_updates": "jjtech_app.jjtech_app.changai_overrides.check_file_updates",
}
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "jjtech_app.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["jjtech_app.utils.before_request"]
# after_request = ["jjtech_app.utils.after_request"]

# Job Events
# ----------
# before_job = ["jjtech_app.utils.before_job"]
# after_job = ["jjtech_app.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"jjtech_app.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

