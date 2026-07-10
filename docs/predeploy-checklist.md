# 배포 전 점검 체크리스트 (Jekyll 1차 전환용)

## 1) 자동 점검 실행
- 실행: `bash scripts/predeploy-check.sh`
- 기대 결과: `Pre-deploy check passed.`
- 실패 시: 실패 항목 우선 수정 후 재실행

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
