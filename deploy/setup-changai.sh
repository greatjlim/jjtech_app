#!/usr/bin/env bash
# changAI(github.com/ERPGulf/changai, MIT)를 ERPNext 메인 스택에 설치한다.
#
# 전제:
#   - frappe_docker가 워크스페이스 루트에 클론돼 있고, pwd.yml + jjtech-dev
#     override로 이미 정상 기동 중이다 (README.md "다른 서버에 배포하기" 3번까지 완료).
#   - jjtech_app이 이미 install-app 돼있고 6개 서비스에 bind mount + editable
#     설치가 끝난 상태다.
#
# 실행 후에도 남는 수동 작업 (API 키를 다룰 수 없어 자동화 불가):
#   Desk > ChangAI Settings 에서 Gemini API 키 입력 (aistudio.google.com, 무료 티어)
#   -> "Download Embedding Model" 클릭 -> "마스터 데이터 동기화" 실행.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
FRAPPE_DOCKER_DIR="$WORKSPACE_DIR/frappe_docker"
CHANGAI_DIR="$WORKSPACE_DIR/apps/changai"
SITE_NAME="${SITE_NAME:-frontend}"
SERVICES=(backend frontend websocket queue-long queue-short scheduler)

COMPOSE=(docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml -f overrides/compose.changai.yaml)

echo "== workspace: $WORKSPACE_DIR =="
echo "== site: $SITE_NAME =="

if [ ! -d "$FRAPPE_DOCKER_DIR" ]; then
  echo "frappe_docker가 없습니다: $FRAPPE_DOCKER_DIR (먼저 README.md의 배포 절차 1~3번을 진행하세요)" >&2
  exit 1
fi

if [ ! -d "$CHANGAI_DIR" ]; then
  echo "-- changAI 클론 --"
  git clone https://github.com/ERPGulf/changai.git "$CHANGAI_DIR"
else
  echo "-- changAI 이미 존재, 클론 건너뜀: $CHANGAI_DIR --"
fi

echo "-- overrides/compose.changai.yaml 생성 --"
sed "s|__WORKSPACE_DIR__|$WORKSPACE_DIR|g" \
  "$SCRIPT_DIR/compose.changai.yaml" \
  > "$FRAPPE_DOCKER_DIR/overrides/compose.changai.yaml"

cd "$FRAPPE_DOCKER_DIR"

echo "-- 컨테이너에 changai bind mount 반영 (recreate) --"
"${COMPOSE[@]}" up -d --force-recreate "${SERVICES[@]}"

for svc in "${SERVICES[@]}"; do
  echo "-- [$svc] jjtech_app editable 재설치 (recreate로 venv 초기화됨) --"
  "${COMPOSE[@]}" exec "$svc" /home/frappe/frappe-bench/env/bin/pip install -e apps/jjtech_app

  echo "-- [$svc] torch(CPU 전용) 설치 --"
  "${COMPOSE[@]}" exec "$svc" /home/frappe/frappe-bench/env/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu

  echo "-- [$svc] changai editable 설치 --"
  "${COMPOSE[@]}" exec "$svc" /home/frappe/frappe-bench/env/bin/pip install -e apps/changai
done

echo "-- sites/apps.txt 확인/수정 --"
"${COMPOSE[@]}" exec backend sh -c "printf 'frappe\nerpnext\njjtech_app\nchangai\n' > sites/apps.txt"

echo "-- install-app changai --"
"${COMPOSE[@]}" exec backend bench --site "$SITE_NAME" install-app changai

echo "-- migrate (changAI DocType 동기화) --"
"${COMPOSE[@]}" exec backend bench --site "$SITE_NAME" migrate

echo "-- 서비스 재시작 --"
"${COMPOSE[@]}" restart "${SERVICES[@]}"

cat <<'EOF'

changAI 설치 완료. 남은 수동 작업:
  1. Desk 로그인 -> ChangAI Settings 열기
  2. Gemini API 키 입력 (https://aistudio.google.com 에서 무료 발급)
  3. "Download Embedding Model" 클릭
  4. "마스터 데이터 동기화" 실행 (거래처명/품목코드 등을 인식시키는 단계, 필수)
EOF
