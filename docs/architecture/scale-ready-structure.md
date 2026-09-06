# 바른자리 Scale-ready Structure Plan

> Status: PHASE 1 COMPLETE
> Last updated: 2026-09-06
> Scope: bareunspace/blog

이 문서는 CMS 전환 계획이 아니다. 현재 Jekyll + GitHub Pages 구조를 유지하면서, AI/Copilot 반복 수정 시 운영정보·예약링크·콘텐츠·UI를 잘못 건드릴 위험을 줄이는 점진적 구조화 계획이다.

## 기본 원칙

- 새 구조를 만들기 전에 기존 source of truth를 먼저 사용한다.
- 현재 정상 동작하는 SEO/URL/CTA/UI는 구조 정리를 이유로 바꾸지 않는다.
- 큰 리팩터링보다 작은 변경 + 검증 + rollback을 우선한다.
- 예약 증가, 운영 효율, 오류 감소, 2호점 복제 가능성에 직접 도움이 없는 구조 변경은 하지 않는다.

## 현재 기준 Source of Truth

```text
_data/
  operations.yml       # 지점, 운영정보, 상품, 가격, 상품별 예약 URL
  post_categories.yml  # post category allowlist
  navigation.yml       # navigation
  seo_pages.yml        # page SEO
  seo_posts.yml        # post SEO
```

`business.yml`, `products.yml`, `booking.yml`, `categories.yml`은 현재 만들지 않는다.

## Phase 1 — Validation Baseline Repair

Status: COMPLETE
Risk: LOW
Production UI change: 없음

### 1-1. category allowlist 정합성

완료:

- [x] 실제 사용 중인 category가 기존 allowlist보다 넓다는 점 확인
- [x] `_data/post_categories.yml`에 현재 유효 category 추가
- [x] 구형/신형 명칭이 섞인 상태에서는 글 category를 강제 일괄변경하지 않음

현재 허용값:

```text
면접준비
스터디룸
스터디·소모임
프라이빗시간
미팅·상담
미팅·업무
연습·리허설
시간·공간
```

주의:
- `시험·응시`는 현재 실제 post category가 아니라 blog 화면에서 특정 시험 글을 묶어 보여주는 표시 그룹이다.
- 화면 표시 그룹과 front matter category allowlist를 같은 개념으로 강제하지 않는다.

Commit:
- `84c99d52122cfa378fcc395b9c1df90837c4a548`

### 1-2. predeploy validation deterministic 분리

완료:

- [x] `scripts/predeploy-check.sh`에서 네이버 RSS 동기화 제거
- [x] 검증 스크립트가 현재 저장소 상태만 검사하도록 변경
- [x] Jekyll build 유지
- [x] front matter/category 검사 유지
- [x] canonical/GA/Clarity/JSON-LD 검사 유지
- [x] 필수 산출물 검사 유지
- [x] unresolved Liquid 검사 유지
- [x] 실질 검사가 없던 experimental content-quality 단계 제거
- [x] `docs/predeploy-checklist.md`에서 RSS 동기화와 배포 검증을 명확히 분리

Commits:
- `6c8e90bd8b17c0c907310a9acb9ec847211ee5d5`
- `eac6616d4bb88c2a0e9f1b24d2530c64a29882c0`

### 1-3. 실제 실행 검증

완료:

- [x] 임시 GitHub Actions runner에서 `bash scripts/predeploy-check.sh` 실제 실행
- [x] 1차 실행 실패 원인 분석
- [x] 홈 FAQPage 검사가 현재 JSON-LD 구조와 맞지 않는 오래된 검사임을 확인
- [x] `_posts/2026-08-06-august-two-hour-focus-time.md`가 일반 콘텐츠가 아닌 `layout:null` redirect stub임을 확인
- [x] redirect stub은 category 필수 검사에서 제외하도록 보정
- [x] 홈 JSON-LD 검사를 현재 구조(LocalBusiness/WebSite/WebPage)에 맞춤
- [x] 2차 GitHub runner 검증 성공

실제 검증 결과:

```text
Passed: 22
Failed: 0
Pre-deploy check passed.
```

검증 커밋:
- `62ddb51f1e71345e09c518a728db4f0f97cc19cb`

### 1-4. Pages deploy gate 연결

완료:

- [x] `scripts/predeploy-check.sh`에 기존 `_site` 빌드 재사용 모드 추가
- [x] `.github/workflows/pages.yml`에서 Jekyll build 직후 validation 실행
- [x] 검증 통과 후에만 artifact upload / deploy 진행
- [x] GitHub Actions에서 Build with Jekyll 성공 확인
- [x] Validate rendered site 성공 확인
- [x] Upload artifact 성공 확인
- [x] Deploy to GitHub Pages 성공 확인
- [x] 임시 `verify-predeploy.yml` workflow 제거

Commits:
- `f4aef92d9491876053470f1efcda8f0ea4cc580a`
- `0ab80cf82cc984eea8889e860286f83961ed7d6e`
- `96ef58c4453fc0b0c721b0975896d32917fda003`

결론:
- Phase 1 완료
- 프로덕션 UI/URL/SEO 구조 변경 없음
- 앞으로 main 배포는 Jekyll build 후 validation을 통과해야 실제 Pages deploy가 진행됨

---

## Phase 2 — Copilot / AI Guardrails

Status: TODO
Risk: LOW

우선 적용 후보:

```text
.github/copilot-instructions.md
```

핵심 규칙:
- 새 `_data` 파일 생성 전 `operations.yml`, `navigation.yml`, SEO data 확인
- 가격/운영정보 변경 시 `operations.yml` 우선
- 예약 URL은 역할 확인 후 수정
- permalink/canonical/H1/검색의도 임의 변경 금지
- 전체 리팩터링보다 최소 변경
- 수정 후 validation 실행

---

## Phase 3 — Existing `operations.yml` Adoption

Status: TODO
Risk: LOW-MEDIUM

새 데이터 구조를 만들지 않고 기존 `operations.yml` 사용을 필요한 곳에만 확대한다.

우선 후보:
- price / price_label
- 상품별 booking_url
- 최대 인원
- 주소
- 주차
- 프로모션

하드코딩이 1~2곳이고 변경 가능성이 낮다면 굳이 바꾸지 않는다.

---

## Phase 4 — Booking Link Role Normalization

Status: TODO
Risk: MEDIUM

링크 역할을 분리해 관리한다.

```text
internal booking hub   -> /booking/
general Naver booking  -> 네이버 일반 예약
product booking        -> 상품 직접 예약
overnight booking      -> 올나잇 상품
map                     -> 지도
talk                    -> 톡톡
```

이번 구조화 과정에서는 CTA 목적지를 바꾸지 않고 source만 정리한다.

---

## Phase 5 — Multi-location Readiness

Status: WATCH
Trigger: 2호점 실제 확정

2호점 확정 전에는 `locations.yml`을 만들지 않는다.

확정 후 아래 중 선택:
1. `operations.yml`을 multi-location으로 확장
2. 규모가 커질 경우 `_data/locations.yml` 분리

## 당장 하지 않는 것

- 전체 CMS 전환
- 신규 `business.yml/products.yml/booking.yml/categories.yml` 생성
- 전체 `_posts` 일괄 구조변환
- URL 구조 변경
- 성장 중 페이지 대규모 리라이트

## 진행 로그

| Date | Phase | Change | Result | Next |
|---|---|---|---|---|
| 2026-09-05 | Planning | 기존 구조 재검증 | 새 파일보다 기존 `operations.yml` 활용이 맞음 | Validation 우선 |
| 2026-09-06 | Phase 1 | category allowlist 정합성 보완 | Production UI 영향 없음 | predeploy 정리 |
| 2026-09-06 | Phase 1 | RSS sync와 validation 분리 | 검증 deterministic화 | 실제 실행 |
| 2026-09-06 | Phase 1 | GitHub runner 실제 실행 | 1차 3 fail → 오탐 2종 보정 → 22 pass / 0 fail | Pages gate 연결 |
| 2026-09-06 | Phase 1 | Pages workflow validation gate 연결 | build / validate / upload / deploy 모두 성공 | Phase 2 |

## 의사결정 규칙

각 단계 전 확인:

1. 실제 반복 수정/오류 위험이 있는가?
2. 이미 같은 역할의 source of truth가 있는가?
3. 사용자 화면/SEO를 바꾸지 않고 내부만 개선 가능한가?
4. 작은 범위로 먼저 시험 가능한가?
5. 즉시 rollback 가능한가?
6. 현재 성장 흐름을 건드릴 만큼 이익이 충분한가?

하나라도 불명확하면 WATCH 상태로 남긴다.
