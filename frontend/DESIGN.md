# Design Conventions

jjtech_app 프론트엔드 화면을 만들 때 따르는 규칙. `reference/front-end-main`(Smart MES) 샘플에서
차용한 스타일을 이 프로젝트(Vue 3 + Vuetify, ag-grid 없이 순수 Vuetify 컴포넌트만 사용)에 맞게
정리한 것이다. 새 화면을 추가할 때는 여기 패턴을 우선 따르고, 새로운 패턴이 필요하면 이 문서에
추가한다.

## Colors / Theme

`src/plugins/vuetify.ts`의 `jjtechTheme` 참조 (primary `#1e88e5`). 커스텀 색상을 화면에서
하드코딩하지 말고 `color="primary"` 등 테마 토큰을 사용한다.

## List screens (검색 + 목록)

- 페이지 최상단에 `<h1 class="text-h5 font-weight-bold mb-4">화면 제목</h1>`.
- 목록은 `v-card` 안에 검색창 + `v-data-table`.
- 검색창: `v-text-field` + `prepend-inner-icon="mdi-magnify"`, `hide-details`, 입력을
  `setTimeout` 기반으로 400ms 디바운스한 뒤 서버 재조회. (`src/views/CompanyListView.vue` 참고)
- 식별자 역할을 하는 컬럼(이름 등)은 `<a>` + `@click.prevent`로 클릭 가능한 링크 스타일
  (`text-primary font-weight-medium text-decoration-none`)로 렌더링해 상세 페이지로 이동시킨다.
- 전체 노출 필드가 아니라 "기본정보" 위주로 컬럼을 추려서 보여준다 (DocType의 회계/설정성 필드는
  상세 화면에서도 다루지 않음).

## Detail/Edit screens (조회 + 수정)

- `<h1 class="text-h5 font-weight-bold mb-4">화면 제목</h1>` 아래 `v-card` 하나.
- 섹션 제목은 `<h6 class="text-h6 mb-4">섹션명</h6>` (예: "기본정보"). 여러 섹션이 있으면
  `v-divider`로 구분.
- 필드는 `v-row` / `v-col cols="12" md="4"`(또는 `md="6"`) 그리드에 `LabelWithElement`
  (`src/components/LabelWithElement.vue`)로 감싸서 배치 — 라벨이 입력 위에 오는 형태.
  ```html
  <v-col cols="12" md="4">
    <LabelWithElement title="전화번호">
      <v-text-field v-model="form.phone_no" />
    </LabelWithElement>
  </v-col>
  ```
- rename 등 부작용이 있는 필드(Company의 `company_name`처럼 docname과 얽힌 필드)는
  `disabled` 텍스트필드로 표시만 하고 수정은 막는다.
- 저장/취소 버튼은 카드 하단에 `v-spacer` 뒤로 배치. 취소는 `color="error" variant="text"`,
  저장은 `color="success"` (참고 샘플의 `modify-popup.vue` 관례 그대로).

## Feedback (저장 결과 안내)

- 저장 성공/실패는 `v-snackbar`로 알린다. 화면마다 별도 상태(`snackbar`, `snackbarText`,
  `snackbarColor`)를 두고, 성공은 `color="success"`, 실패는 `color="error"`.
- 에러 메시지는 `ApiError`(`src/api/client.ts`)의 `message`를 그대로 스낵바 텍스트로 사용한다.

## API 계층

- 읽기: `apiGet`, 생성/수정: `apiPut`(`src/api/client.ts`) — CSRF 토큰을 자동으로 붙인다.
- DocType별 API는 `src/api/<doctype>.ts`에 `list*`/`get*`/`update*` 형태로 얇게 감싼다
  (`src/api/company.ts` 참고). `/api/resource/*` 응답의 `{data: ...}` 래핑을 이 계층에서 풀어서
  반환하고, 화면 컴포넌트는 언랩된 값만 다룬다.
