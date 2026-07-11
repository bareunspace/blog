# 릴리즈/버전 관리 가이드

이 문서는 "지금부터 새 버전으로 다시 관리"하기 위한 운영 기준입니다.

## 1) 버전 규칙

- 형식: `MAJOR.MINOR.PATCH` (예: `1.2.3`)
- MAJOR: 구조/레이아웃 대변경, 호환성 영향
- MINOR: 기능 추가 (페이지/섹션/자동화 개선)
- PATCH: 오탈자, 스타일, 버그 수정

## 2) 저장소 기준 파일

- `VERSION`: 현재 배포 버전 단일 소스
- `CHANGELOG.md`: 버전별 변경 이력

## 3) 배포 전 순서

1. 기능 작업 후 버전 결정
2. `VERSION` 업데이트
3. `CHANGELOG.md`에 Added/Changed/Fixed 기록
4. 사전 점검 실행
   - `bash scripts/predeploy-check.sh`
5. 커밋
6. 태그 생성
   - `git tag -a v$(cat VERSION) -m "Release v$(cat VERSION)"`
7. 태그 푸시
   - `git push origin v$(cat VERSION)`

## 4) 브랜치 운영

- `main`: 운영 배포
- `feature/*`: 기능 작업
- `hotfix/*`: 긴급 수정

## 5) 커밋 메시지 예시

- `feat: add faq section layout`
- `fix: adjust hero spacing on mobile`
- `chore: bump version to 1.0.1`

브랜치/머지 규칙은 `CONTRIBUTING.md`를 따릅니다.

## 6) 이번 리셋 기준점

- 기준 버전: `1.0.0`
- 날짜: `2026-07-11`
- 이후부터는 반드시 `VERSION` + `CHANGELOG.md`를 같이 갱신합니다.
