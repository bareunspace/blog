# 바른자리 Scale-ready Structure Plan

> Status: PHASE 2 COMPLETE
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

완료 요약:

- [x] 실제 taxonomy와 `_data/post_categories.yml` 정합성 보완
- [x] RSS sync와 deterministic predeploy validation 분리
- [x] redirect stub을 일반 콘텐츠 검사에서 제외
- [x] 홈 JSON-LD 검사를 현재 구조에 맞춤
- [x] GitHub runner에서 실제 검증 성공: `22 PASS / 0 FAIL`
- [x] Pages workflow에 validation gate 연결
- [x] Build → Validate → Upload → Deploy 전체 성공 확인

주요 commits:
- `84c99d52122cfa378fcc395b9c1df90837c4a548`
- `6c8e90bd8b17c0c907310a9acb9ec847211ee5d5`
- `eac6616d4bb88c2a0e9f1b24d2530c64a29882c0`
- `62ddb51f1e71345e09c518a728db4f0f97cc19cb`
- `f4aef92d9491876053470f1efcda8f0ea4cc580a`
- `0ab80cf82cc984eea8889e860286f83961ed7d6e`
- `96ef58c4453fc0b0c721b0975896d32917fda003`

---

## Phase 2 — Copilot / AI Guardrails

Status: COMPLETE
Risk: LOW
Production UI change: 없음

적용 파일:

```text
.github/copilot-instructions.md
```

적용한 핵심 규칙:

- [x] 새 데이터 구조를 만들기 전에 기존 source of truth 확인
- [x] `_data/operations.yml`을 가격/상품/운영정보의 우선 기준으로 지정
- [x] `_data/post_categories.yml`, navigation, SEO data, blog master template 참조 명시
- [x] `business.yml/products.yml/booking.yml/categories.yml` 신규 생성 금지(architecture plan 변경 전)
- [x] permalink/canonical/title/description/H1/CTA/GA/Clarity/JSON-LD 임의 변경 금지
- [x] 예약 URL은 역할별로 구분하고 목적지를 임의 통합하지 않도록 명시
- [x] redirect/noindex stub을 일반 콘텐츠와 구분
- [x] 검색 의도 중복 시 신규 글보다 기존 글 강화/병합/관찰 우선
- [x] `_layouts`, `_includes`, `styles`, `scripts`, `supabase`, workflow를 고위험 영역으로 지정
- [x] 작은 변경 → validation → 결과 보고 순서를 기본 수정 절차로 지정
- [x] 구조화를 위한 구조화는 하지 않도록 운영/매출/오류감소/다점포 유지보수 기준 명시

이번 단계에서는 `AGENTS.md`나 추가 `.github/instructions/*.instructions.md`를 만들지 않았다. 같은 규칙을 여러 파일에 중복하면 지침 충돌과 유지보수 비용이 커질 수 있기 때문이다.

Commit:
- `6dde4acb4bb090e61f65cd7928c4963814553da8`

결론:
- Phase 2 완료
- 사이트 화면, URL, SEO, 예약 UX 변경 없음
- VS Code Copilot/AI가 저장소 수정 시 우선 확인해야 할 source of truth와 금지선이 저장소 수준에 명시됨

---

## Phase 3 — Existing `operations.yml` Adoption

Status: WATCH
Risk: LOW-MEDIUM

새 데이터 구조를 만들지 않고 기존 `operations.yml` 사용을 필요한 곳에만 확대한다.

우선 후보:
- price / price_label
- 상품별 booking_url
- 최대 인원
- 주소
- 주차
- 프로모션

현재는 자동으로 진행하지 않는다. 하드코딩이 실제 운영 오류나 반복 수정 비용을 만들 때만 착수한다.

---

## Phase 4 — Booking Link Role Normalization

Status: WATCH
Risk: MEDIUM

링크 역할:

```text
internal booking hub   -> /booking/
general Naver booking  -> 네이버 일반 예약
product booking        -> 상품 직접 예약
overnight booking      -> 올나잇 상품
map                     -> 지도
talk                    -> 톡톡
```

현재는 CTA 목적지를 바꾸지 않는다. 실제 URL 변경/운영 오류가 발생할 때 source 정리만 검토한다.

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
- Phase 3~5를 구조 정리 자체를 목적으로 선제 진행

## 진행 로그

| Date | Phase | Change | Result | Next |
|---|---|---|---|---|
| 2026-09-05 | Planning | 기존 구조 재검증 | 새 파일보다 기존 `operations.yml` 활용이 맞음 | Validation 우선 |
| 2026-09-06 | Phase 1 | category / validation / Pages gate 정비 | 22 pass / 0 fail, 실제 deploy 성공 | Phase 2 |
| 2026-09-06 | Phase 2 | `.github/copilot-instructions.md` 추가 | Production 변경 없이 AI/Copilot 수정 guardrail 고정 | Phase 3~5 WATCH |

## 의사결정 규칙

각 단계 전 확인:

1. 실제 반복 수정/오류 위험이 있는가?
2. 이미 같은 역할의 source of truth가 있는가?
3. 사용자 화면/SEO를 바꾸지 않고 내부만 개선 가능한가?
4. 작은 범위로 먼저 시험 가능한가?
5. 즉시 rollback 가능한가?
6. 현재 성장 흐름을 건드릴 만큼 이익이 충분한가?

하나라도 불명확하면 WATCH 상태로 남긴다.
