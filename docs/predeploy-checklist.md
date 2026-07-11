# 배포 전 점검 체크리스트 (Jekyll 1차 전환용)

## 0) 1분 점검 (복붙용)
- 명령 1: `bundle exec jekyll build`
- 명령 2: `bundle exec jekyll serve --livereload`
- 명령 3: 브라우저에서 `http://127.0.0.1:4000` 열기

빠른 확인 항목:
- [ ] 이용사례 섹션 문구 노출 확인
- [ ] 콘솔 에러 없음
- [ ] 모바일 화면에서 문장 줄바꿈 자연스러움

## 1) 자동 점검 실행
- 실행: `bash scripts/predeploy-check.sh`
- 기대 결과: `Pre-deploy check passed.`
- 실패 시: 실패 항목 우선 수정 후 재실행

자동 점검 항목:
- [ ] Jekyll 의존성 설치 및 빌드 성공
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

## 권장 실행 순서
1. 로컬 자동 점검
2. 미리보기 배포
3. 수동 점검
4. 운영 배포

## 새 페이지 생성(쉬운 방법)
- 가이드: `docs/new-page-quickstart.md`
- 생성 명령: `bash scripts/new-page.sh <slug> "<title>" "<description>" ["<keywords>"]`
