# Jekyll Migration Plan (for bareunjari.com)

## Goal
- Keep current UX and URLs stable.
- Reduce duplicated HTML blocks first.
- Move to maintainable Jekyll structure in 2 phases.

## Current Snapshot
- Main pages: `index.html`, `about.html`
- Verification pages: `googlebf2d4abd9a14843f.html`, `naver5fe3663045eafa19ecaa866c5476b7a2.html`
- Shared assets: `styles/main.css`, `scripts/main.js`, `images/*`
- Data candidate: `data/branches.sample.json`

---

## Phase 1: Minimal Jekyll Adoption (recommended first)

### Scope
- Keep page content mostly as-is.
- Extract shared head/header/footer to includes.
- Introduce a default layout and front matter.
- Keep existing URL behavior.

### Files to add
- `_config.yml`
- `Gemfile`
- `_layouts/default.html`
- `_includes/head.html`
- `_includes/header.html`
- `_includes/footer.html`

### Files to update
- `index.html` (add front matter, use layout, remove duplicated wrapper)
- `about.html` (add front matter, use layout, remove duplicated wrapper)

### Files to keep unchanged
- `styles/main.css`
- `scripts/main.js`
- `robots.txt`
- `sitemap.xml` (temporary: keep static until Phase 2)
- verification HTML files (keep at root exactly)

### Suggested front matter
```yaml
---
layout: default
title: 부천 신중동역 공간대여 | 스터디룸·회의실·화상면접 | 바른자리
description: 부천 신중동역 도보 1분. 면접, 스터디, 상담, 회의를 위한 프라이빗 공간대여. 나만의 시간을 예약하세요.
permalink: /
---
```

```yaml
---
layout: default
title: 바른자리 브랜드 스토리 | 나만의 시간을 위한 개인시간 플랫폼
description: 바른자리가 공간 대여를 넘어 누구나 필요할 때 나만의 시간을 가질 수 있도록 만드는 개인시간 플랫폼으로 시작한 이유와 운영 철학을 소개합니다.
permalink: /about.html
---
```

### Suggested _config.yml baseline
```yaml
title: 바른자리
url: "https://bareunjari.com"
baseurl: ""
language: ko-KR
permalink: pretty
markdown: kramdown
plugins:
  - jekyll-sitemap
  - jekyll-seo-tag
exclude:
  - docs/
  - data/
```

### Local run commands
```bash
bundle install --path vendor/bundle
bundle exec jekyll serve --livereload
```

### Phase 1 validation checklist
- [ ] Home URL is still `/`
- [ ] About URL is still `/about.html`
- [ ] Tracking scripts work (GA/Clarity)
- [ ] Structured data remains valid
- [ ] Mobile nav and all JS interactions still work
- [ ] Verification HTML files reachable directly

---

## Phase 2: Full Jekyll Conversion

### Scope
- Split long HTML into reusable sections.
- Move branch and growth data to `_data`.
- Optional blog/content expansion with posts or collections.
- Replace static sitemap with generated sitemap.

### Additional files/folders
- `_data/branches.json` (migrate from `data/branches.sample.json`)
- `_includes/sections/*.html` (home blocks)
- `_pages/about.md` (optional route normalization)
- `_posts/*` (if blog/news needed)

### Suggested improvements
- Use `jekyll-seo-tag` for common SEO tags.
- Keep page-specific JSON-LD in per-page includes.
- Build branch cards from `_data/branches.json` via Liquid loops.
- Move static long sections into include partials for easier editing.

### Phase 2 validation checklist
- [ ] No SEO regression (title, canonical, OG/Twitter)
- [ ] Sitemap generated correctly
- [ ] All internal links resolved
- [ ] Branch data renders correctly
- [ ] Existing external campaign/booking links unchanged

---

## Rollback strategy
- Keep migration in a feature branch.
- Deploy preview first.
- If any production issue: revert to last static build artifact.

## Recommended execution order
1. Bootstrap Jekyll config/Gemfile.
2. Add layout/includes.
3. Convert `index.html` and `about.html` only.
4. Smoke test and deploy.
5. Start Phase 2 after stable period.
