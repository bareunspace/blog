# 바른자리 Scale-ready Structure Plan

> Status: PLANNING / REVALIDATED
> Last updated: 2026-09-05
> Scope: bareunspace/blog

이 문서는 바른자리 사이트를 CMS로 전환하기 위한 문서가 아니다. 현재 Jekyll + GitHub Pages 구조를 유지하면서, AI가 반복 수정할 때 운영정보·예약링크·콘텐츠·UI를 잘못 건드릴 위험을 줄이기 위한 점진적 구조화 계획과 진행기록이다.

## 목표

구조화 여부는 아래 기준으로 판단한다.

1. 예약 증가 또는 전환 안정성에 도움이 되는가
2. 운영 수정 시간을 줄이는가
3. 동일 정보를 여러 파일에서 수정하는 오류를 줄이는가
4. 2호점 이후 같은 구조를 복제하기 쉬워지는가
5. 현재 SEO·URL·화면·예약 UX를 불필요하게 흔들지 않는가

CMS 도입 자체는 목표가 아니다. 현재 AI + VS Code/GitHub 수정 흐름보다 CMS가 더 단순해지는 시점이 오기 전까지는 도입하지 않는다.

## 2026-09-05 재검증 결과

초기 플랜의 방향은 맞지만, 현재 저장소를 다시 확인한 결과 아래 항목을 수정한다.

### 확인된 사실

- `_data/operations.yml`이 이미 존재하며 지점, 프로모션, 상품, 가격, 예약 URL, 주차 등 주요 운영정보를 보유하고 있다.
- `index.html`, `booking/index.html`, `study.html`, footer 등 일부 페이지는 이미 `site.data.operations`를 사용한다.
- 따라서 `business.yml`, `products.yml`, `booking.yml`을 새로 만드는 것은 당장 필요 없고 source of truth를 중복시킬 수 있다.
- `_data/post_categories.yml`도 이미 존재하므로 `categories.yml` 신설 역시 불필요하다.
- 반면 `post_categories.yml`의 허용 목록은 실제 현재 콘텐츠 taxonomy와 일치하지 않는다. 예: `연습·리허설`, `스터디·소모임` 등 실제 사용 category가 존재한다.
- `scripts/predeploy-check.sh`에는 Jekyll build, category allowlist, SEO, unresolved Liquid 검사 등이 이미 존재한다.
- 하지만 `.github/workflows/pages.yml`은 현재 Jekyll build만 수행하고 `predeploy-check.sh`를 배포 게이트로 사용하지 않는다.
- `predeploy-check.sh`는 네이버 블로그 RSS 동기화까지 실행하므로 그대로 CI gate로 연결하면 네트워크 의존성과 데이터 변경이 섞인다.
- 외부 예약 링크는 한 종류가 아니다. 내부 `/booking/`, 네이버 플레이스 일반 예약, 상품 직접 예약, 올나잇 상품, 지도/톡톡 링크가 서로 다른 역할을 가진다. 하나의 `naver_url`로 무조건 합치면 안 된다.
- VS Code GitHub Copilot이 실제로 자동 참조하는 저장소 지침은 `.github/copilot-instructions.md`이며, 필요하면 `.github/instructions/**/*.instructions.md` 또는 `AGENTS.md`를 추가할 수 있다. 임의의 `AI_EDIT_RULES.md`만 만들어서는 자동 적용을 보장하기 어렵다.

### 결론

**새 구조를 만드는 프로젝트가 아니라, 이미 있는 `operations.yml`과 검증체계를 정리·완성하는 프로젝트로 축소한다.**

## 변경 금지 원칙

구조화 과정에서 아래 결과물은 의도적으로 변경하지 않는다.

- 기존 public URL / permalink
- canonical
- 검색 노출 중인 title / description / H1
- 기존 본문 의미
- 이미지 URL과 ALT
- 내부링크 목적지
- 현재 CSS class 및 화면 구조
- 네이버 예약 CTA의 최종 목적지
- 기존 GA4/GSC 추적 동작

내부 데이터 소스만 바꾸더라도 최종 생성 HTML은 가능하면 동일하게 유지한다.

## 현재 기준 Source of Truth

당분간 아래 기존 파일을 우선 사용한다.

```text
_data/
  operations.yml       # 지점, 운영정보, 상품, 가격, 상품별 예약 URL
  post_categories.yml  # post category allowlist
  navigation.yml       # 화면별 navigation 구성
  seo_pages.yml        # 페이지 SEO 데이터
  seo_posts.yml        # 글 SEO 데이터
  ...                  # 기존 데이터 파일 유지
```

### 지금 만들지 않는 파일

```text
_data/business.yml
_data/products.yml
_data/booking.yml
_data/categories.yml
```

필요성이 실제로 생기기 전에는 만들지 않는다. `operations.yml`이 지나치게 커지거나 2호점 도입으로 역할 분리가 필요할 때만 재검토한다.

## 수정된 단계별 실행 계획

### Phase 0 — Baseline / Inventory

Status: IN PROGRESS
Risk: 없음
Production change: 없음

이미 확인한 것:

- [x] 기존 `_data/` 구조 확인
- [x] `operations.yml`이 운영정보 source of truth 역할을 이미 수행 중임을 확인
- [x] 예약 URL이 여러 역할로 존재함을 확인
- [x] 기존 predeploy 검증 스크립트 존재 확인
- [x] 실제 Pages workflow가 predeploy 검증을 사용하지 않음을 확인
- [x] category allowlist와 실제 사용 category 간 불일치 확인

남은 inventory:

- [ ] 외부 예약 URL을 역할별로 목록화: general / product / overnight / map / talk
- [ ] `operations.yml`을 이미 사용하는 파일과 아직 하드코딩된 파일을 구분
- [ ] 가격·시간·주소·주차 정보 중 실제로 3곳 이상 반복되는 값만 목록화
- [ ] 현재 Jekyll production build 성공 상태를 baseline으로 기록

완료 조건: 중앙화할 대상과 그대로 둘 대상을 구분할 수 있어야 한다.

---

### Phase 1 — Validation Baseline Repair

Status: TODO
Risk: LOW
Production UI change: 없음

중앙화보다 먼저 현재 검증체계를 신뢰할 수 있게 만든다.

#### 1-1. category allowlist 정합성

- [ ] 현재 실제 post category 전체 확인
- [ ] `_data/post_categories.yml`을 실제 taxonomy와 맞춤
- [ ] homepage/blog의 표시용 필터 목록과 category allowlist를 동일 개념으로 강제하지 않음
  - allowlist = 유효한 전체 taxonomy
  - 화면 필터 = 화면별로 노출할 curated subset

#### 1-2. predeploy check 정리

현재 `predeploy-check.sh`는 검증과 RSS 동기화가 섞여 있다.

- [ ] 네트워크/데이터 동기화 작업과 deterministic validation을 분리
- [ ] Jekyll build
- [ ] front matter/category
- [ ] canonical/SEO
- [ ] unresolved Liquid
- [ ] 필수 파일 존재

위 항목은 네트워크 없이 재현 가능한 검증으로 유지한다.

#### 1-3. CI 연결 여부

검증이 실제 저장소와 일치하는 상태가 된 뒤에만 Pages workflow에 deploy gate로 연결한다.

- [ ] validation script 단독 성공 확인
- [ ] 기존 GitHub Pages build 결과와 동일한지 확인
- [ ] 실패 시 deploy를 막아도 false positive가 없는지 확인
- [ ] 그 후 `.github/workflows/pages.yml`에 validation step 추가 검토

완료 조건: “로컬에서는 쓰지만 배포에서는 무시되는 검사”가 아니라 실제 신뢰 가능한 안전장치가 된다.

Rollback: workflow gate 추가 후 문제가 생기면 gate만 제거하고 기존 Pages build로 즉시 복귀 가능해야 한다.

---

### Phase 2 — Copilot / AI Guardrails

Status: TODO
Risk: LOW
Production UI change: 없음

구조 변경 전에 AI가 현재 source of truth를 이해하도록 만든다.

우선 파일:

```text
.github/copilot-instructions.md
```

필요 시 추가:

```text
.github/instructions/*.instructions.md
AGENTS.md
```

지침에 포함할 내용:

- 새 `_data` 파일을 만들기 전에 기존 `operations.yml`, `navigation.yml`, SEO data를 먼저 확인한다.
- 가격/운영정보 변경 시 `operations.yml`을 먼저 확인한다.
- 예약 URL을 하나의 URL로 간주하지 말고 역할을 확인한다.
- `_posts/**` 수정 시 permalink/canonical/H1/검색의도를 임의로 바꾸지 않는다.
- `styles/**`, `scripts/**`, `supabase/**`, `.github/**`의 구조적 변경은 별도 검토 대상으로 취급한다.
- 전체 리팩터링보다 최소 변경을 우선한다.
- 수정 후 existing validation을 실행한다.
- 구조 변경 전 이 planning 문서를 확인한다.

완료 조건: VS Code Copilot에서 새 세션을 열어도 위 원칙이 자동 컨텍스트로 적용되어야 한다.

---

### Phase 3 — Existing `operations.yml` Adoption

Status: TODO
Risk: LOW-MEDIUM

새 데이터 구조를 만들지 않고 현재 `operations.yml` 사용을 필요한 곳에만 확대한다.

우선순위:

1. 실제 반복 변경 가능성이 높은 사실값
2. 잘못되면 예약/매출에 직접 영향이 있는 값
3. 여러 파일에 중복된 값

후보:

- 상품별 price / price_label
- 상품별 booking_url
- 최대 인원
- 주소
- 주차 무료시간
- 프로모션 정보

원칙:

- [ ] 이미 `operations.yml`을 쓰는 페이지는 그대로 유지
- [ ] 하드코딩이 1~2곳뿐이고 변경 가능성이 낮으면 굳이 바꾸지 않음
- [ ] 검색 문맥에 따라 달라야 하는 설명문은 중앙화하지 않음
- [ ] UI 문구 전체를 데이터화하지 않음
- [ ] 한 파일/한 컴포넌트씩 변경 후 rendered HTML 비교

예: homepage 가격 카드에서 예약 URL은 이미 중앙값을 사용하지만 일부 가격 표시는 하드코딩되어 있다. 반복 변경 위험이 실제로 있다고 판단될 때 `price_label` 사용으로 맞춘다.

완료 조건: 운영정보 수정 시 파일 수가 줄어들되 화면/SEO/CTA 흐름은 바뀌지 않는다.

---

### Phase 4 — Booking Link Role Normalization

Status: TODO
Risk: MEDIUM

초기 플랜의 “예약 URL 하나로 중앙화”는 폐기한다.

먼저 링크 역할을 분리한다.

```text
internal_booking_hub   -> /booking/
general_naver_booking  -> 네이버 플레이스 일반 예약
hourly/product booking -> 일반 공간대여 상품 직접 링크
overnight booking      -> 올나잇 상품 직접 링크
map                    -> 지도
talk                   -> 톡톡
```

이후 실제 운영상 필요한 경우에만 `operations.yml` 내부에 booking 관련 registry를 추가한다.

예상 예시:

```yaml
booking:
  hub: /booking/
  general_url: ...
  map_url: ...
  talk_url: ...

products:
  hourly:
    booking_url: ...
  overnight:
    booking_url: ...
```

중요:

- 일반 CTA를 상품 직접 링크로 바꾸거나 그 반대로 바꾸는 것은 단순 리팩터링이 아니라 UX 변경이다.
- CTA 목적지 변경은 GA4 클릭/예약 전환에 영향을 줄 수 있으므로 별도 실험 또는 명확한 운영 이유가 있을 때만 한다.
- 이번 구조화 작업에서는 링크 목적지를 바꾸지 않고 source만 정리한다.

---

### Phase 5 — Multi-location Readiness

Status: WATCH
Risk: MEDIUM
Trigger: 2호점 입지/계약이 실제로 확정될 때

2호점이 확정되기 전에는 `locations.yml`을 만들지 않는다.

2호점 확정 후 아래 중 하나를 선택한다.

1. `operations.yml`을 multi-location 구조로 확장
2. 규모가 커질 경우에만 `_data/locations.yml` 분리

판단 기준:

- 지점별 가격이 다른가
- 지점별 예약 URL이 다른가
- 지점별 주차/주소/인원/운영시간이 다른가
- 공통 UI가 어느 정도 유지되는가

목표는 지점별 사이트를 복사해서 따로 유지하는 것이 아니라 공통 구조를 재사용하는 것이다.

## 당장 하지 않는 것

- 전체 사이트 CMS 전환
- `business.yml`, `products.yml`, `booking.yml`, `categories.yml` 신규 생성
- 전체 `_posts` HTML을 한 번에 YAML 모듈로 변환
- 모든 개별 글을 하나의 획일적 layout으로 강제
- URL 구조 변경
- SEO가 성장 중인 페이지 대규모 리라이트
- 구조 정리를 이유로 신규 콘텐츠 대량 생성
- `predeploy-check.sh`를 현재 상태 그대로 Pages workflow에 연결
- 예약 링크 종류를 확인하지 않고 하나의 URL로 통합

## 진행 로그

| Date | Phase | Change | Result | Next |
|---|---|---|---|---|
| 2026-09-05 | Planning | 기존 문서를 현재 Jekyll 구조 기준 migration plan으로 개편 | Production 변경 없음 | 구조 검증 |
| 2026-09-05 | Revalidation | `_data`, `operations.yml`, category allowlist, predeploy script, Pages workflow, Copilot instruction 방식 재검증 | 초기 계획 일부 수정 필요 확인 | Phase 0 inventory 마무리 후 Phase 1 |

## 의사결정 규칙

각 Phase 시작 전 아래를 확인한다.

1. 실제 반복 수정 또는 오류 위험이 있는가?
2. 이미 같은 역할을 하는 source of truth가 존재하지 않는가?
3. 사용자 화면/SEO를 바꾸지 않고 내부만 개선 가능한가?
4. 변경 범위를 한두 파일 수준으로 먼저 시험할 수 있는가?
5. 즉시 rollback 가능한가?
6. 현재 사이트가 정상 성장 중이라면 구조 변경으로 얻는 이익이 충분한가?

하나라도 명확하지 않으면 구현하지 않고 WATCH 상태로 남긴다.
