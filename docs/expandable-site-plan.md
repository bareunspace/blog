# 확장형 웹사이트 기획안 (본사 미확정 버전)

## 목표
- 현재 1개 지점 운영을 유지하면서, 지점이 늘어날 때 같은 구조로 빠르게 복제 가능하게 준비한다.
- 지금은 화면 개편보다 데이터/운영 기준 통일에 집중한다.

## 운영 가정
- 법인/본사 체계는 아직 미정이다.
- 외부 문구는 "브랜드 운영" 또는 "운영팀" 중심으로 중립 표현을 사용한다.
- 내부 구조는 멀티 지점을 전제로 설계한다.

## 단계별 실행

### 1단계: 지금 바로 (1개 지점 유지)
- 단일 페이지를 유지한다.
- 지점 고유 정보(주소/전화/예약/지도/영업시간)를 데이터 파일로 분리한다.
- 이벤트 트래킹 네이밍에 지점 식별자(branchSlug)를 포함한다.
- 문의 유형에 "지점 운영 제안" 항목을 추가한다.

### 2단계: 2호점 확정 직전
- /locations 목록 페이지를 추가한다.
- /locations/{branch-slug} 상세 템플릿을 1개 만든다.
- 지점별 SEO 메타/JSON-LD(LocalBusiness) 템플릿을 적용한다.

### 3단계: 3개 지점 이상
- sitemap 자동 생성으로 전환한다.
- 지점 상태(open/coming_soon/closed)를 데이터로 관리한다.
- 오픈 체크리스트 통과 시에만 공개 배포한다.

## 정보 구조 (IA)
- / : 대표 랜딩(현재 페이지)
- /about : 브랜드 스토리/운영 철학
- /locations : 지점 목록 (초기에는 준비중 처리 가능)
- /locations/{branch-slug} : 지점 상세
- /partner : 운영 제안/입점 문의 ("가맹" 대신 중립 표현)

## 데이터 모델
- Branch
  - id
  - slug
  - name
  - status (open, coming_soon, closed)
  - address
  - contact (phone, email)
  - hours
  - bookingUrl
  - mapUrl
  - heroImage
  - gallery
  - pricePlans
  - seo (title, description, ogImage)
- Campaign
  - id
  - title
  - startAt
  - endAt
  - targetBranches
  - ctaText
- FAQ
  - scope (common, branch)
  - question
  - answer

## 콘텐츠 원칙
- 공통 문구와 지점 문구를 분리한다.
- 지점 페이지에는 고유 주소/전화/지도/사진을 반드시 포함한다.
- 공통 문구를 그대로 복사한 지점 페이지를 대량 생성하지 않는다.

## 이벤트 트래킹 규칙
- 이벤트명 형식: action_object_branchSlug_placement
- 예시
  - click_booking_bucheon-sinjungdong_hero
  - click_talk_bucheon-sinjungdong_contact
  - submit_contact_bucheon-sinjungdong_contact

## 화면 변경 최소안
- 현재 index를 그대로 유지한다.
- 헤더 메뉴에 "지점 안내"는 숨김 메뉴로 준비한다.
- 문의 섹션에 "운영 제안" 링크를 준비한다.

## 위험요소와 대응
- 위험: 지점별 정보 누락으로 잘못된 노출 발생
  - 대응: 필수 입력값 검증과 오픈 체크리스트 사용
- 위험: SEO 중복 페이지 발생
  - 대응: canonical, 지점별 고유 메타, 지점별 JSON-LD 분리
- 위험: 트래킹 지표 혼재
  - 대응: branchSlug 포함 이벤트 규칙 강제

## 이번 달 액션 5개
1. 지점 데이터 파일 도입 (현재 1개 지점만 입력)
2. 지점 slug 규칙 확정 (영문 소문자 + 하이픈)
3. 트래킹 이벤트 네이밍 표준 적용
4. 운영 제안 문의 템플릿 작성
5. 지점 오픈 체크리스트 운영 시작
