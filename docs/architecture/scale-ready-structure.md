# 바른자리 Scale-ready Structure Plan

> Status: PLANNING
> Last updated: 2026-09-05
> Scope: bareunspace/blog

이 문서는 바른자리 사이트를 CMS로 전환하기 위한 문서가 아니다. 현재 Jekyll + GitHub Pages 구조를 유지하면서, AI가 반복 수정 시 운영정보·예약링크·콘텐츠·UI를 잘못 건드릴 위험을 줄이기 위한 점진적 구조화 계획과 진행기록이다.

## 목표

구조화 여부는 아래 기준으로 판단한다.

1. 예약 증가 또는 전환 안정성에 도움이 되는가
2. 운영 수정 시간을 줄이는가
3. 동일 정보를 여러 파일에서 수정하는 오류를 줄이는가
4. 2호점 이후 같은 구조를 복제하기 쉬워지는가
5. 현재 SEO·URL·화면·예약 UX를 불필요하게 흔들지 않는가

CMS 도입 자체는 목표가 아니다. 현재 AI + VS Code/GitHub 수정 흐름보다 CMS가 더 단순해지는 시점이 오기 전까지는 도입하지 않는다.

## 현재 확인된 구조

- 사이트는 Jekyll/GitHub Pages 기반이다.
- 블로그 콘텐츠는 `_posts/` 아래 Markdown + front matter로 관리되고 있다.
- title, description, category, permalink, canonical, image 정보 등은 이미 상당 부분 구조화되어 있다.
- `blog.html`과 `index.html`은 front matter/category 값을 읽어 Practical Guides를 구성한다.
- `_templates/barunjari-blog-post.md`에 콘텐츠 작성 표준과 UI 골격이 존재한다.
- 반면 일부 글 본문에는 예약 URL, 가격/시간 상품 설명, CTA, 개별 UI HTML이 직접 들어가 있다.

즉, 전체 재구축이 아니라 **반복 운영정보의 source of truth만 점진적으로 중앙화**하는 것이 우선이다.

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

## 목표 구조

```text
_data/
  business.yml       # 주소, 역, 주차, 인원, 기본 운영정보
  booking.yml        # 공식 예약 URL / 예약 관련 공통 값
  products.yml       # 시간, 가격, 활성 상태, 추천 상태
  categories.yml     # 콘텐츠 taxonomy
  locations.yml      # 향후 1호점/2호점 데이터

_posts/
  ...                # 현재 구조 유지, 필요할 때만 점진 정리

_includes/
  booking-cta.html   # 공통 CTA
  price-card.html    # 필요 시 공통 상품 UI
  location.html      # 필요 시 공통 지점 UI

_layouts/
  ...                # 당장은 구조 개편하지 않음

docs/architecture/
  scale-ready-structure.md

AI_EDIT_RULES.md     # 후속 단계에서 추가
scripts/
  validate-content.* # 후속 단계에서 추가
```

위 디렉터리 전체를 한 번에 만들 필요는 없다. 실제 반복 수정이 확인된 항목부터 추가한다.

## 단계별 실행 계획

### Phase 0 — Baseline / Inventory

Status: TODO
Risk: 없음
Production change: 없음

- [ ] 현재 예약 URL이 하드코딩된 파일 목록 확인
- [ ] 현재 가격/시간 정보가 반복된 파일 목록 확인
- [ ] 주소·주차·인원·운영시간 반복 위치 확인
- [ ] 기존 `_data/` 항목과 충돌 여부 확인
- [ ] 현재 build/deploy 정상 상태를 기준선으로 기록

완료 조건: 어떤 정보를 중앙화할지와 영향 파일이 명확해야 한다.

---

### Phase 1 — Booking URL 중앙화

Status: TODO
Risk: LOW

가장 먼저 할 구조 변경. 예약 URL 변경 시 여러 페이지를 찾아 수정하는 위험을 줄이는 것이 목적이다.

예정:

```yaml
# _data/booking.yml
naver_url: https://...
booking_page: /booking/
```

적용 원칙:

- [ ] 데이터 파일을 먼저 추가한다.
- [ ] 추가 직후에는 기존 페이지와 연결하지 않는다.
- [ ] 한 페이지의 CTA 한 개만 데이터 참조 방식으로 변경한다.
- [ ] 빌드 결과의 href가 기존과 동일한지 검증한다.
- [ ] 이상 없으면 홈 → booking → 주요 글 순서로 확대한다.
- [ ] 모든 변경은 작은 commit으로 분리한다.

완료 조건: 중앙 데이터 변경 전후 사용자에게 보이는 URL과 UI가 동일해야 한다.

Rollback: 문제가 발생하면 해당 Liquid 참조만 기존 하드코딩 URL로 복구한다.

---

### Phase 2 — Business / Product 정보 중앙화

Status: TODO
Risk: LOW-MEDIUM

Phase 1이 안정된 뒤에만 진행한다.

후보 정보:

- 1시간 가격
- 시간 상품 구성
- 추천 시간
- 최대 인원
- 신중동역 도보 정보
- 주차 무료시간
- 지점 기본정보

원칙:

- [ ] 실제로 3곳 이상 반복되는 값부터 중앙화한다.
- [ ] 검색 문맥에 따라 표현이 달라야 하는 본문 문장은 중앙화하지 않는다.
- [ ] 구조화를 위해 현재 잘 작동하는 카피를 획일화하지 않는다.
- [ ] 가격/시간 변경 시 모든 관련 페이지가 자동으로 같은 표현이 되는 것이 오히려 부적절한 곳은 예외로 둔다.

완료 조건: 운영정보 변경 시 수정 파일 수가 줄면서도 각 검색 의도의 문맥이 유지되어야 한다.

---

### Phase 3 — AI Safe Edit Rules

Status: TODO
Risk: LOW

`AI_EDIT_RULES.md`를 추가해 AI/Copilot/에이전트가 수정 가능한 영역과 보호 영역을 명시한다.

초안 원칙:

자유 수정 후보:
- `_posts/**`
- `_data/**`
- `images/**`

주의 수정:
- `_includes/**`

사용자 승인 없이 구조 변경 금지 후보:
- `_layouts/**`
- `styles/**`
- `scripts/**`
- `supabase/**`
- `.github/**`

추가 규칙:
- 가격은 중앙 source of truth가 생긴 후 HTML에 새로 하드코딩하지 않는다.
- 예약 URL은 중앙 source of truth가 생긴 후 새로 하드코딩하지 않는다.
- 구조 변경 전 이 문서의 해당 Phase 상태와 검증 항목을 확인한다.

---

### Phase 4 — Automated Validation

Status: TODO
Risk: LOW

AI 수정 후 사람이 모든 페이지를 확인하지 않아도 최소한의 회귀 오류를 잡기 위한 단계다.

검증 후보:

- [ ] YAML/front matter 문법
- [ ] 존재하지 않는 category 사용
- [ ] 중앙화 이후 신규 가격 하드코딩 탐지
- [ ] 중앙화 이후 신규 예약 URL 하드코딩 탐지
- [ ] duplicate canonical
- [ ] 참조 이미지 존재 여부
- [ ] 내부 링크 기본 검사
- [ ] Jekyll build 성공 여부

이 단계는 Phase 1~2에서 실제 반복 오류 위험이 확인된 항목만 자동화한다.

## 당장 하지 않는 것

다음은 현재 우선순위가 아니다.

- 전체 사이트 CMS 전환
- 전체 `_posts` HTML을 한 번에 YAML 모듈로 변환
- 모든 개별 글을 하나의 획일적인 layout으로 강제
- URL 구조 변경
- SEO가 성장 중인 페이지의 대규모 리라이트
- 구조 정리를 이유로 신규 콘텐츠를 대량 생성

## 2호점 확장 시 사용

2호점이 확정되면 `locations.yml` 도입을 재검토한다.

예상 구조:

```yaml
locations:
  - id: sinjungdong
    name: 신중동점
    address: ...
    booking_url: ...

  - id: second
    name: ...
    address: ...
    booking_url: ...
```

목표는 지점별 사이트를 복사해 따로 유지하는 것이 아니라, 공통 UI/콘텐츠 구조를 유지하면서 지점정보만 분리하는 것이다.

## 진행 로그

| Date | Phase | Change | Result | Next |
|---|---|---|---|---|
| 2026-09-05 | Planning | 기존 `scale-ready-structure.md`를 현재 Jekyll 구조 기준의 관리형 migration plan으로 개편 | Production 변경 없음 | Phase 0 inventory |

## 의사결정 규칙

각 Phase 시작 전 아래를 확인한다.

1. 실제 반복 수정 또는 오류 위험이 있는가?
2. 사용자 화면/SEO를 바꾸지 않고 내부만 개선 가능한가?
3. 변경 범위를 한두 파일 수준으로 먼저 시험할 수 있는가?
4. 즉시 rollback 가능한가?
5. 지금 사이트가 정상 성장 중이라면 구조 변경으로 얻는 이익이 충분한가?

하나라도 명확하지 않으면 구현하지 않고 이 문서에 WATCH 상태로 남긴다.
