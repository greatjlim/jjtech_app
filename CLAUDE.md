# jjtech_app

`Jjtech App` 모듈을 제공하는 커스텀 Frappe 앱. (git remote: github.com/greatjlim/jjtech_app)

## 원칙: frappe/erpnext 원본 수정 금지

`frappe`, `erpnext` 등 core 앱의 코드는 절대 직접 수정하지 않는다.
필요한 변경은 항상 이 앱(`jjtech_app`) 안에서 다음 방식으로만 구현한다.

- 필드 추가/UI 변경 → Custom Field / Property Setter (아래 규칙 준수)
- 로직 변경 → `hooks.py`의 `doc_events`, `override_whitelisted_methods`,
  `extend_doctype_class` 등을 이용한 override/extend
- core dist-packages 안의 파일을 직접 고치는 것도 금지 (재배포/마이그레이션 시 사라짐)

## Custom Field / customization 규칙

Custom Field, Property Setter, Client Script, Server Script를 만들 때는
**반드시 module에 `Jjtech App`을 지정**한다. `hooks.py`의 fixtures가
`module = "Jjtech App"` 필터로 export 대상을 한정하고 있기 때문에,
module을 비워두거나 다른 값으로 두면 fixture로 export되지 않아 다른 사이트에
앱을 설치해도 해당 커스터마이징이 따라오지 않는다.

```python
# jjtech_app/jjtech_app/hooks.py 발췌
fixtures = [
    {"doctype": "Custom Field", "filters": [["module", "=", "Jjtech App"]]},
    {"doctype": "Property Setter", "filters": [["module", "=", "Jjtech App"]]},
    {"doctype": "Client Script", "filters": [["module", "=", "Jjtech App"]]},
    {"doctype": "Server Script", "filters": [["module", "=", "Jjtech App"]]},
]
```

Desk UI(Customize Form 등)에서 커스터마이징을 만들 때 module 필드가
자동으로 채워지지 않는 경우가 있으니, 저장 전 module 값을 확인한다.

## Fixture export + 커밋 세트

Desk에서 Custom Field 등을 만들거나 고친 뒤에는 반드시 export-fixtures로
DB 상태를 앱의 fixture json 파일로 내려받는다.

```bash
cd frappe_docker
docker compose -f pwd.yml -f overrides/compose.jjtech-dev.yaml exec backend \
  bench --site frontend export-fixtures --app jjtech_app
```

이후 git commit은 다음을 **한 세트**로 묶어서 커밋한다 (fixture만 따로,
또는 hooks.py 변경만 따로 커밋하지 않는다):

- `hooks.py`의 fixtures 설정 변경 (있는 경우)
- export-fixtures로 갱신된 `jjtech_app/fixtures/*.json`

## 커밋 메시지 규칙

Conventional Commits 스타일 접두사를 사용한다.

- `feat:` 새 기능/커스터마이징 추가
- `fix:` 버그 수정
- `chore:` 설정, 빌드, 잡일성 변경 (기능 변화 없음)

기존 커밋 예시:
```
feat: configure fixtures with module filter in hooks.py
feat: Initialize App
```

## 새 DocType 생성 규칙

- 이 앱의 새 DocType은 module을 `Jjtech App`으로 지정해서 생성한다.
- DocType 정의는 `jjtech_app/jjtech_app/doctype/<doctype_name>/` 아래
  JSON + Python 파일로 저장되므로 fixture가 필요 없다 (그대로 git 커밋 대상).
- DocType 이름은 영문으로 짓고, 한글 표시가 필요하면 label/번역으로 처리한다.
- 스키마(JSON) 변경 후에는 `bench --site frontend migrate`를 실행한다.