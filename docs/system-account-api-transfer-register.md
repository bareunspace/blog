# 바른자리 시스템·계정·API·이전 관리대장

> 목적: 바른자리 운영에 사용하는 시스템, 외부 서비스, 계정, API, 배포·데이터 구조를 한곳에서 관리하고 향후 담당자 변경·2호점 확장·서버 이전·사업 양도 시 빠르게 인수인계할 수 있도록 한다.
>
> 보안 원칙: 이 문서에는 실제 비밀번호, OTP 복구코드, service-role key, OpenAI API key, Resend API key, Telegram Bot Token 등 비밀값을 절대 적지 않는다. 키 이름과 확인/재발급 위치만 기록한다.

마지막 점검일: 2026-08-11

## 1. 핵심 구조 요약

현재 바른자리 사이트는 다음 구조가 중심이다.

- 소스 저장소: GitHub `bareunspace/blog`
- 사이트 생성: Jekyll 4.4
- 배포: GitHub Actions → GitHub Pages
- 운영 도메인: `bareunjari.com`
- DB/Auth/서버리스 기능: Supabase
- 관리자 로그인: Supabase Auth + 사이트 내 관리자 이메일 allowlist
- 분석: Google Analytics 4, Microsoft Clarity
- AI 기능: OpenAI API (Supabase Edge Function에서 호출)
- 이메일 알림: Resend API (Supabase Edge Function에서 호출)
- 네이버 블로그: RSS 동기화 스크립트 + GitHub Actions
- 예약: 현재 네이버 예약을 주요 예약 채널로 사용
- 자동화: Zapier/Telegram은 운영 자동화 계정에서 관리 예정 또는 별도 관리. 저장소 내 직접 연결 코드는 2026-08-11 기준 확인되지 않음.

## 2. 시스템 자산대장

| 시스템 | 역할 | 관리/로그인 위치 | 주요 설정·키 | 현재 저장 위치 | 이전 가능성 | 이전 시 핵심 작업 |
|---|---|---|---|---|---|---|
| GitHub | 전체 소스·버전관리·Actions | https://github.com | GitHub 계정, 저장소 권한 | GitHub | 매우 높음 | 저장소 clone/mirror 또는 조직 이전, Actions 재설정 |
| Jekyll 4.4 | 정적 사이트 빌드 | 별도 로그인 없음 | Gemfile, `_config.yml` | GitHub 저장소 | 매우 높음 | 다른 호스팅에서도 `bundle exec jekyll build` 가능 |
| GitHub Pages | 운영 사이트 호스팅 | GitHub → Repository → Settings → Pages | Pages 설정, Actions 권한 | GitHub | 높음 | Cloudflare Pages, Netlify, S3/CloudFront 등으로 이전 가능 |
| bareunjari.com | 운영 도메인 | 도메인 등록업체 계정 확인 필요 | DNS, 네임서버, CNAME/A 레코드 | 도메인 등록업체 | 매우 높음 | 새 호스팅 목적지로 DNS 변경 |
| Supabase | DB, Auth, Edge Functions | https://supabase.com/dashboard | Project URL, anon/publishable key, service-role key, Auth, RLS, Secrets | Supabase + 일부 public 설정은 `_config.yml` | 높음 | DB dump/restore, migration, Auth·Secrets·Functions 재구성 |
| Supabase Auth | 관리자 인증 | Supabase Dashboard → Authentication | Auth 사용자, 로그인 방식 | Supabase | 높음 | 사용자 이전 또는 신규 프로젝트에서 관리자 재생성 |
| 바른자리 Admin | `/admin-login.html`, `/admin.html` | 바른자리 사이트 | `supabase_url`, `supabase_anon_key`, 관리자 allowlist | `_config.yml`, `scripts/admin-auth.js` | 매우 높음 | Supabase URL/key와 관리자 목록만 새 환경에 맞게 변경 |
| Google Analytics 4 | 방문·전환 분석 | https://analytics.google.com | Measurement ID | `_config.yml` | 매우 높음 | 같은 Property 유지 또는 새 Property ID로 교체 |
| Microsoft Clarity | 행동 분석·세션 리플레이 | https://clarity.microsoft.com | Clarity Project ID | `_config.yml` | 매우 높음 | 동일 프로젝트 유지 또는 새 ID 교체 |
| OpenAI API | AI 면접 피드백 기능 | https://platform.openai.com | `OPENAI_API_KEY` | Supabase Edge Function Secret | 높음 | 새 환경에 Secret 재등록, 호출 Function 재배포 |
| Resend | 커뮤니티 신청 이메일 알림 | https://resend.com | `RESEND_API_KEY`, 발신 도메인 설정 | Supabase Edge Function Secret | 높음 | 새 환경에 Secret·발신 도메인/DNS 재설정 |
| Naver Blog RSS Sync | 네이버 블로그 글 동기화 | GitHub Actions + Naver Blog | 블로그 RSS 주소/동기화 규칙 | `.github/workflows`, `scripts/automation`, `_data/naver_blog.yml` | 매우 높음 | 스크립트와 workflow 함께 이전 |
| Naver Search Advisor | 네이버 검색 소유확인/색인 | https://searchadvisor.naver.com | 사이트 소유확인 파일/메타 | 저장소에 소유확인 HTML 존재 | 높음 | 도메인 유지 시 검증 재확인, 호스팅 변경 후 소유확인 점검 |
| Naver 예약 | 실제 예약·결제 채널 | 네이버 스마트플레이스/예약 관리자 | 사업장·상품·예약·결제 설정 | Naver | 중간~높음 | 사이트와 분리되어 있어 사이트 호스팅 이전 영향은 작음. 예약 플랫폼 자체 이전 시 별도 데이터/정책 검토 필요 |
| Zapier | 예약/알림 자동화 | https://zapier.com/app | 연결 앱 계정, Zap, Webhook/API 연결 | Zapier 계정 | 높음 | Zap export/재구성, 새 endpoint와 credentials 재연결 |
| Telegram Bot | 운영 알림 수신 | Telegram + BotFather | Bot Token, Chat ID | Telegram/Zapier 쪽에서 관리 권장 | 높음 | Bot Token 또는 새 Bot 생성 후 Zap 연결 변경 |
| Pages CMS | 운영용 경량 CMS | https://app.pagescms.org | GitHub 연결, CMS config | GitHub 연동 | 높음 | GitHub 저장소 유지 시 재연결 가능. 실제 config 존재 여부는 별도 점검 |
| Canva | 대표 이미지/디자인 작업 | https://www.canva.com | 계정, 브랜드 자산, 디자인 | Canva | 높음 | 디자인 공유/소유권 이전 또는 원본 export |

## 3. 현재 코드에서 확인된 설정과 비밀값 분리

### 공개되어도 되는 클라이언트 설정

다음 값은 브라우저에서 사용하는 public client 설정이다.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 또는 Supabase publishable key
- GA Measurement ID
- Clarity Project ID

현재 저장소의 `.env.example`에서도 `SUPABASE_URL`, `SUPABASE_ANON_KEY`를 public client config로 구분하고 있다.

### 절대 GitHub 공개 저장소에 넣으면 안 되는 값

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- Telegram Bot Token
- Zapier private webhook/token
- 도메인 등록업체 비밀번호
- GitHub PAT
- 관리자 비밀번호
- OTP 복구 코드
- 기타 Secret Key

이 값들은 Supabase Secrets, Zapier Connection, GitHub Actions Secrets 또는 별도 Password Manager에 저장한다.

## 4. Supabase 관리 항목

현재 코드에서 확인되는 Supabase 역할은 단순 DB보다 넓다.

1. 관리자 로그인 인증
2. 커뮤니티/신청 관련 데이터
3. RLS 기반 데이터 접근
4. Edge Function 실행
5. AI 면접 피드백 Function
6. 커뮤니티 신청 알림 Function

### 관련 코드

- `supabase/migrations/`
- `supabase/functions/ai-interview-feedback/index.ts`
- `supabase/functions/community-application-notify/index.ts`
- `scripts/admin-auth.js`
- `scripts/community-applications.js`
- `scripts/admin-community.js`
- `admin-login.html`
- `admin.html`

### 이전 전에 반드시 백업할 것

- 전체 PostgreSQL DB schema + data
- `supabase/migrations/` 전체
- Auth 사용자 목록
- RLS policies
- Edge Functions
- Edge Function Secrets 목록(값 자체가 아닌 이름 목록도 별도 기록)
- Storage 사용 시 bucket/object 목록
- Redirect URL / Site URL / Auth 설정

## 5. API 및 Secret 이름 관리표

| Secret/Key 이름 | 용도 | 권장 저장 위치 | 실제 값 문서 기록 |
|---|---|---|---|
| `SUPABASE_URL` | Supabase endpoint | `_config.yml`/환경설정 | URL은 기록 가능 |
| `SUPABASE_ANON_KEY` / publishable key | 브라우저 Supabase 호출 | `_config.yml` 또는 public env | 전체 값 기록 불필요 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 관리자 권한 | Supabase/GitHub Secret | 금지 |
| `OPENAI_API_KEY` | AI 면접 피드백 | Supabase Edge Function Secret | 금지 |
| `RESEND_API_KEY` | 이메일 발송 | Supabase Edge Function Secret | 금지 |
| Telegram Bot Token | Telegram 알림 | Zapier/비밀관리자 | 금지 |
| Telegram Chat ID | 수신 채팅 지정 | Zapier/비밀관리자 | 필요 시 마스킹 |
| Zapier Webhook/API credential | 자동화 | Zapier Connection | 금지 |
| GA Measurement ID | Analytics | `_config.yml` | 기록 가능 |
| Clarity Project ID | Clarity | `_config.yml` | 기록 가능 |

## 6. 관리자 로그인 구조

사이트 관리자 인증 흐름은 다음과 같다.

1. `/admin-login.html`에서 이메일/비밀번호 입력
2. Supabase `signInWithPassword()` 호출
3. Supabase Auth 사용자 검증
4. `_config.yml`에 설정된 관리자 허용 이메일 목록과 추가 비교
5. 허용되면 `/admin.html`로 이동

따라서 이전 시 필요한 것은 관리자 페이지 자체의 별도 서버가 아니라 다음 네 가지다.

- Supabase 프로젝트
- Auth 관리자 사용자
- Supabase public URL/key
- 관리자 허용 이메일 설정

## 7. 배포 구조

현재 `main` 브랜치 push 시 GitHub Actions가 실행된다.

```text
GitHub main
   ↓
GitHub Actions
   ↓
Ruby/Jekyll build
   ↓
_site 생성
   ↓
GitHub Pages deploy
   ↓
bareunjari.com
```

이 구조는 vendor lock-in이 낮다. Jekyll build 결과는 정적 HTML이므로 Cloudflare Pages, Netlify, Vercel의 정적 배포, AWS S3 + CloudFront 등으로 비교적 쉽게 이전할 수 있다.

## 8. 전체 이전 시 권장 순서

### A. 사이트 호스팅만 이전

1. GitHub 저장소 백업
2. 새 호스팅에서 Jekyll build 테스트
3. preview URL에서 전체 페이지 확인
4. Supabase/CORS/Auth Redirect 설정 확인
5. Analytics/Clarity 확인
6. DNS TTL 낮추기
7. `bareunjari.com` DNS 변경
8. HTTPS 확인
9. Naver/Google 검색도구 소유권·sitemap 확인
10. 기존 GitHub Pages 종료는 안정화 후 진행

예상 난이도: 낮음

### B. Supabase까지 새 프로젝트로 이전

1. 기존 DB dump
2. migration 파일 검토
3. 새 Supabase 프로젝트 생성
4. schema/data restore
5. RLS policy 점검
6. Auth 관리자/사용자 이전 전략 적용
7. Edge Functions deploy
8. Secrets 재등록
9. `_config.yml`의 URL/public key 변경
10. staging에서 관리자·커뮤니티·AI 기능 테스트
11. production 전환

예상 난이도: 중간

### C. GitHub 계정/조직까지 이전

1. repository transfer 또는 새 조직으로 mirror
2. Actions permissions 확인
3. Pages 설정 재생성
4. Pages CMS 등 GitHub OAuth 연결 재인증
5. 외부 서비스 webhook/연결 확인
6. DNS 변경 필요 여부 확인

예상 난이도: 낮음~중간

## 9. 서비스별 장애 영향

| 장애 서비스 | 영향 |
|---|---|
| GitHub Pages | 사이트 접속 불가 |
| GitHub Actions | 새 변경사항 배포 불가, 기존 사이트는 유지될 수 있음 |
| Supabase DB | 관리자/커뮤니티/동적 기능 장애 |
| Supabase Auth | 관리자 로그인 불가 |
| OpenAI API | AI 면접 피드백만 장애, 기본 사이트는 정상 |
| Resend | 이메일 알림 장애, DB 접수 자체는 별도 확인 필요 |
| Google Analytics | 분석 데이터 수집 장애, 사이트 이용은 정상 |
| Clarity | 행동 분석만 장애 |
| Naver 예약 | 예약 접수에 직접 영향 |
| Zapier | 자동 알림·후속 처리 장애 |
| Telegram | 관리자 실시간 알림 장애 |

## 10. 백업 정책 권장안

### 매일/상시

- GitHub main 브랜치가 소스 백업 역할
- Supabase 자동 백업 제공 범위 확인

### 월 1회

- Supabase DB 수동 dump 보관
- 운영에 사용 중인 Secret 이름 목록 점검
- Zap 목록/자동화 구성 캡처 또는 문서화
- 도메인/DNS 레코드 export 또는 캡처

### 큰 변경 전

- Git tag 또는 release 생성
- Supabase DB dump
- `_config.yml` 백업
- DNS 현재 상태 기록
- 중요한 Zap 일시 중지 여부 검토

## 11. 2호점 확장 시 체크

2호점이 생겨도 모든 시스템을 별도로 복제할 필요는 없다.

권장 방식:

- GitHub: 하나의 저장소 유지
- 사이트: 하나의 도메인/사이트에서 지점 선택
- Supabase: 하나의 프로젝트에서 `location_id`/`branch_id`로 지점 분리
- 관리자: 한 Auth 체계 유지
- Analytics/Clarity: 기본적으로 하나의 Property/Project 유지
- Naver 예약: 지점별 예약 상품/플레이스 구조 검토
- Zapier: 지점 정보 기준 routing
- Telegram: 하나의 관리자 채널 또는 지점별 채널 선택

즉, 2호점 때문에 전체 시스템을 복제하기보다는 데이터 모델에 지점 개념을 넣는 것이 관리상 유리하다.

## 12. 아직 확인이 필요한 항목

다음은 GitHub 코드만으로 실제 계정 소유자나 설정 상태까지 확인할 수 없는 항목이다.

- `bareunjari.com` 도메인 등록업체 이름과 로그인 계정
- Google Search Console 실제 Property/소유 계정
- Naver Search Advisor 실제 등록 계정
- Naver SmartPlace/예약 관리자 계정
- GA4 실제 Property 관리자 계정
- Microsoft Clarity 실제 프로젝트 관리자 계정
- Supabase 프로젝트의 billing/owner 계정
- OpenAI API 프로젝트/결제 계정
- Resend 계정 및 발신 도메인
- Zapier 계정 및 현재 Zap 목록
- Telegram Bot 이름/Chat ID/Token 보관 위치
- Pages CMS 실제 연결 상태와 config 파일 위치
- Canva 팀/브랜드 자산 소유권

이 항목은 각 서비스에 직접 로그인한 뒤 확인해서 이 문서에 **계정 이메일의 일부 마스킹 또는 담당자명**, **복구 이메일/2FA 여부**, **결제 주체**, **소유자/관리자 역할**만 추가한다. 비밀번호는 기록하지 않는다.

## 13. 인수인계 최소 세트

다른 운영자가 바른자리를 인수하더라도 아래 세트가 있으면 시스템 이전이 가능하다.

1. GitHub 저장소 관리자 권한
2. 도메인/DNS 관리자 권한
3. Supabase Owner/Admin 권한
4. Naver SmartPlace/예약 관리자 권한
5. GA4/Clarity/Search Console/Search Advisor 권한
6. OpenAI/Resend API 재발급 권한
7. Zapier 자동화 관리자 권한
8. Telegram Bot 관리 권한
9. Canva 디자인 자산 접근권한
10. 운영용 이메일 계정과 2FA 복구 체계

## 14. 결론

현재 바른자리 구조는 GitHub + Jekyll + Supabase 중심이라 전체적으로 이전성이 높은 편이다. 특히 사이트 프런트엔드는 정적 사이트라 호스팅 이전이 쉽고, Supabase도 PostgreSQL/migration 기반이므로 데이터 이전이 가능하다.

가장 중요한 리스크는 기술적인 vendor lock-in보다 **계정 소유권과 Secret 관리가 여러 서비스에 흩어지는 것**이다. 따라서 앞으로 신규 솔루션을 추가할 때는 반드시 이 문서에 서비스명, 로그인 위치, 담당 계정, Secret 이름, 결제 주체, 장애 영향, 이전 방법을 추가한다.
