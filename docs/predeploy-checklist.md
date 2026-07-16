# 배포 전 점검 체크리스트 (Jekyll 1차 전환용)

## 0) 1분 점검 (복붙용)
- 실행: `bash scripts/one-minute-check.sh`
- 동작: 빌드 후 미리보기 서버 실행 (`http://127.0.0.1:4000`은 브라우저에서 직접 확인)
- 종료: 터미널에서 `Ctrl+C`

빠른 확인 항목:
- [ ] 이용사례 섹션 문구 노출 확인
- [ ] 콘솔 에러 없음
- [ ] 모바일 화면에서 문장 줄바꿈 자연스러움

## 1) 자동 점검 실행
- 실행: `bash scripts/predeploy-check.sh`
- 기대 결과: `Pre-deploy check passed.`
- 실패 시: 실패 항목 우선 수정 후 재실행

RSS 동기화(수동 실행 필요 시):
- 실행: `bash scripts/sync-naver-blog.sh`
- 동작: 네이버 블로그 RSS 전체 글을 `_data/naver_blog.yml`에 자동 반영

GitHub 자동 동기화:
- 워크플로: `.github/workflows/naver-blog-rss-sync.yml`
- 주기: 매일 00:15 UTC (한국시간 09:15)
- 수동 실행: GitHub Actions 탭에서 `Naver Blog RSS Sync` > `Run workflow`

자동 점검 항목:
- [ ] Jekyll 의존성 설치 및 빌드 성공
- [ ] 네이버 블로그 RSS 동기화 성공
- [ ] `_posts` 글 front matter에 `category` 필수 입력 (브레드크럼 `Home > Blog > Category > 제목` 노출용)
- [ ] 필수 산출물 파일 존재(`index/about/robots/sitemap/인증 파일`)
- [ ] SEO/분석 태그(canonical, GA, Clarity, JSON-LD) 포함
- [ ] 렌더 결과 HTML에 미처리 Liquid 태그 없음

## 2) 수동 점검 (필수)
- [ ] 홈 `/` 접속 확인
- [ ] 소개 `/about.html` 접속 확인
- [ ] 모바일 메뉴 토글 동작 확인
- [ ] 문의 폼 제출 동작 확인
- [ ] 주요 CTA 링크(예약/문의) 동작 확인
- [ ] 라이트박스/맨위 버튼 동작 확인

## 3) SEO 수동 확인
- [ ] 홈 페이지 title/description/OG 미리보기 확인
- [ ] 소개 페이지 title/description/OG 미리보기 확인
- [ ] Search Console/네이버 인증 경로 직접 접속 확인

## 4) 배포 직후 확인
- [ ] 실제 도메인에서 canonical URL 확인
- [ ] 실제 도메인에서 이벤트 수집(GA/Clarity) 확인
- [ ] robots.txt, sitemap.xml 실서비스 경로 확인

## 5) 버전 관리(릴리즈 시)
- [ ] `VERSION` 갱신
- [ ] `CHANGELOG.md`에 변경 내역 기록
- [ ] 릴리즈 태그 생성: `git tag -a v$(cat VERSION) -m "Release v$(cat VERSION)"`
- [ ] 태그 푸시: `git push origin v$(cat VERSION)`
- [ ] 상세 가이드 확인: `docs/release-versioning.md`

## 권장 실행 순서
1. 로컬 자동 점검
2. 미리보기 배포
3. 수동 점검
4. 운영 배포

## 새 페이지 생성(쉬운 방법)
- 가이드: `docs/new-page-quickstart.md`
- 생성 명령: `bash scripts/new-page.sh <slug> "<title>" "<description>" ["<keywords>"]`
