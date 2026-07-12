# Jjtech App

JJtech(알루미늄 압출 제조업) 전용 ERP 커스텀 앱. ERPNext(Frappe Framework) 위에서
동작하며, 화면은 ERPNext Desk를 쓰지 않고 이 저장소의 `frontend/`(Vue 3 + Vite +
Vuetify)가 별도 SPA로 REST API를 통해 데이터를 가져다 쓰는 구조다.

## 구성

```
jjtech_app/
├── jjtech_app/     # Frappe 앱 본체 (DocType, 서버 API, hooks.py 등)
├── frontend/       # 독립 Vue SPA (Frappe Desk와 별개, Vite로 직접 빌드)
└── deploy/         # 배포용 스크립트/템플릿 (changAI 설치 등)
```

## 로컬 개발 환경

로컬 개발은 `docker compose`로 띄운 ERPNext에 이 저장소를 bind mount해서 진행한다.
전체 절차(컨테이너 기동, bench 명령, 코드 수정 후 재시작 규칙 등)는 워크스페이스
루트의 `CLAUDE.md`에 정리돼 있다. 이 저장소 하나만 봐서는 로컬 개발 환경 전체를
알 수 없으니, 처음 세팅한다면 그 문서를 먼저 확인한다.

## 다른 서버에 배포하기

"ERPNext를 도커로 받고, 이 저장소를 클론하고, 프론트엔드를 `npm run dev`로 띄우면
끝"이 아니다. 최소한 아래 단계가 다 필요하다.

### 0. 준비물

- Docker Engine + Docker Compose가 설치된 서버
- node(LTS) — 프론트엔드 빌드용. 서버 자체에 없어도 되고, 빌드만 다른 곳(CI, 로컬)에서
  해서 결과물만 서버로 옮겨도 된다.

### 1. ERPNext 도커 스택 준비

```bash
git clone https://github.com/frappe/frappe_docker
cd frappe_docker
```

`pwd.yml`은 손대지 않는다. 커스터마이징이 필요하면 항상 `overrides/`에 파일을
추가하는 방식으로 한다.

### 2. jjtech_app 코드 받고 컨테이너에 연결

```bash
git clone <이 저장소 URL> apps/jjtech_app   # frappe_docker와 같은 위치에 클론
```

`overrides/compose.jjtech-dev.yaml`과 같은 override 파일을 만들어서, `apps/jjtech_app`을
`backend`/`frontend`/`websocket`/`queue-long`/`queue-short`/`scheduler` 6개 서비스
모두에 `/home/frappe/frappe-bench/apps/jjtech_app`으로 bind mount한다(정확한 예시는
개발 워크스페이스의 `frappe_docker/overrides/compose.jjtech-dev.yaml` 참고).

### 3. 컨테이너 기동 + jjtech_app 앱 설치

```bash
docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml up -d
```

사이트가 새로 만들어진 뒤, **Python을 실행하는 6개 서비스 전부**에 editable
설치를 해준다. `docker compose exec`의 기본 PATH에는 venv가 없어서 `pip`를
풀패스로 불러야 한다(안 그러면 설치는 성공한 것처럼 보이는데 실제 반영이 안 됨):

```bash
for svc in backend frontend websocket queue-long queue-short scheduler; do
  docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml exec $svc \
    /home/frappe/frappe-bench/env/bin/pip install -e apps/jjtech_app
done
docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml restart \
  backend frontend websocket queue-long queue-short scheduler
```

새 서버라 사이트에 앱이 아직 설치돼 있지 않으니 명시적으로 설치한다:

```bash
docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml exec backend \
  bench --site <사이트명> install-app jjtech_app
```

**`bench migrate`를 돌리기 전에 반드시 확인**: `sites/apps.txt`에 `frappe`/`erpnext`/
`jjtech_app` 세 줄이 다 있는지 먼저 본다.

```bash
docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml exec backend cat sites/apps.txt
```

`jjtech_app`이 빠져 있으면(이 파일이 `sites/apps.json`이나 DB의 설치 앱 목록과
따로 놀 수 있다) migrate가 jjtech_app의 모든 DocType을 "고아"로 판단해서
메타 정의를 지워버릴 수 있다. 먼저 고친다:

```bash
docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml exec backend \
  sh -c "printf 'frappe\nerpnext\njjtech_app\n' > sites/apps.txt"
```

그 다음 migrate:

```bash
docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml exec backend \
  bench --site <사이트명> migrate
```

### 4. (선택) changAI(AI 채팅) 설치

jjtech_app 화면에 붙어 있는 AI 채팅 위젯은 [changAI](https://github.com/ERPGulf/changai)
(ERPGulf, MIT)가 처리한다. 자연어 질문을 SQL로 바꿔 ERPNext 데이터를 조회해주는
Frappe 앱으로, jjtech_app과 같은 방식(별도 컨테이너 아님, 6개 서비스에 그대로
bind mount)으로 메인 스택에 설치한다.

별도 컨테이너로 자원을 격리해보려 했으나, changAI가 로그인마다
(`on_session_creation`) transformers/faiss/langchain 등 무거운 RAG 스택을
무조건 import하는 구조라 격리 자체가 의미 없다는 걸 확인하고 포기했다 — 어차피
사이트를 서빙하는 모든 컨테이너에 그 무게가 실린다.

```bash
apps/jjtech_app/deploy/setup-changai.sh
```

이 스크립트가 하는 일: changAI 클론 → `overrides/compose.changai.yaml` 생성
→ 6개 서비스에 bind mount 반영(컨테이너 recreate, jjtech_app editable 설치도
자동으로 다시 함) → torch(CPU 전용) + changai 의존성 설치 → `sites/apps.txt`
확인/수정 → `install-app changai` → `migrate`.

**AI 채팅이 실제로 답하려면 스크립트 실행만으로는 부족하다.** API 키가 필요한
단계는 자동화할 수 없으니 스크립트 완료 후 Desk에서 직접 진행한다:

1. Desk 로그인 → "ChangAI Settings" 열기
2. Gemini API 키 입력 ([aistudio.google.com](https://aistudio.google.com)에서 무료 발급)
3. "Download Embedding Model" 클릭
4. "마스터 데이터 동기화" 실행 (거래처명/품목코드 등을 인식시키는 필수 단계)

changAI를 쓰지 않는다면 이 단계는 통째로 건너뛰어도 jjtech_app의 나머지 기능에는
영향이 없다(채팅 위젯 호출만 실패한다).

### 5. 프론트엔드 빌드 & 서빙

`npm run dev`는 로컬 개발 서버라 배포에는 쓰지 않는다. 정적 파일로 빌드해서
별도로 서빙한다.

```bash
cd apps/jjtech_app/frontend
npm install
npm run build   # dist/ 생성
```

`dist/`를 nginx 등 가벼운 정적 서버로 서빙하고, `/api`와 `/desk` 요청만 ERPNext
쪽(위에서 띄운 `frontend` 서비스, 기본 8080 포트)으로 리버스프록시한다. 이
정적 서버는 ERPNext 자체의 `frontend`(Desk용 nginx) 서비스와는 다른 것이므로
이름이 헷갈리지 않게 별도 서비스로 구성하고(예: `jjtech-frontend`), `pwd.yml`이
아니라 새 override 파일에 추가한다.

### 6. (선택) 기존 서버 데이터 이전

새 서버는 빈 사이트로 시작한다. 기존에 쓰던 서버의 데이터(수주/거래처/재고 등)를
그대로 옮기고 싶다면:

```bash
# 기존 서버
docker compose ... exec backend bench --site <사이트명> backup --with-files

# 새 서버로 백업 파일 옮긴 뒤
docker compose ... exec backend bench --site <사이트명> restore <백업파일경로>
```

### 7. (선택) 도메인 / HTTPS

리버스 프록시(Traefik, nginx-proxy 등)로 도메인 연결 + Let's Encrypt 인증서
발급이 필요하면 별도로 진행한다(이 저장소 범위 밖 — frappe_docker의
`docs/03-production/` 문서 참고).

## Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/jjtech_app
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

## License

mit
