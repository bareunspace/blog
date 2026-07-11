# 새 페이지 빠르게 만들기

VS Code에서 파일을 직접 만들어도 되지만, 아래 스크립트를 쓰면 기본 SEO/Front Matter가 자동으로 채워집니다.

## 1) 실행

```bash
bash scripts/new-page.sh <slug> "<title>" "<description>" [options]
```

예시:

```bash
bash scripts/new-page.sh faq "자주 묻는 질문 | 바른자리" "이용 전 자주 묻는 질문을 확인하세요." --keywords "부천공간대여,바른자리,FAQ" --add-sitemap --add-nav --nav-label "자주 묻는 질문" --nav-target both
```

사전 확인만 하고 실제 파일을 건드리지 않으려면:

```bash
bash scripts/new-page.sh faq "자주 묻는 질문 | 바른자리" "이용 전 자주 묻는 질문을 확인하세요." --add-nav --add-sitemap --dry-run
```

## 2) 생성 결과

- 루트에 `<slug>.html` 파일 생성
- Jekyll front matter 자동 입력
- canonical, OG image, preload 이미지 기본값 입력
- `index.html`의 css/script 버전을 자동 상속
- 옵션으로 `sitemap.xml` 자동 반영 가능
- 옵션으로 `_data/navigation.yml` 네비게이션 자동 반영 가능

## 3) 생성 후 꼭 할 일

1. 본문 섹션 내용 수정
2. 필요 시 네비게이션 링크 추가: `_data/navigation.yml`
3. `--add-sitemap`을 안 썼다면 `sitemap.xml`에 URL 추가
4. 배포 전 점검: `bash scripts/predeploy-check.sh` 또는 `--run-check` 옵션 사용

## 4) 자주 쓰는 옵션

```bash
--keywords "키워드1,키워드2"
--label "페이지 라벨"
--add-nav
--nav-label "메뉴명"
--nav-target "home|about|both"
--og-image "https://..."
--og-image-alt "이미지 설명"
--preload-image "images/..webp"
--add-sitemap
--changefreq "monthly"
--priority "0.6"
--run-check
--dry-run
```

## 5) 제한

- slug는 소문자 영문/숫자/하이픈만 허용
- 이미 같은 파일이 있으면 생성하지 않음
