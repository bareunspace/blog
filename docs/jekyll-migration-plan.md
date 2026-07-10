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
title: 부천 신중동역 공간대여 | 면접·회의·시험 프라이빗룸 | 바른자리
description: 부천 신중동역 도보 1분, 다양한 사용 목적에 맞춰 잠시라도 독립된 공간이 필요할 때 필요한 시간만큼 단독 이용하는 프라이빗 공간.
permalink: /
---
```

```yaml
---
layout: default
title: 바른자리 브랜드 스토리 | 조용한 몰입을 위한 프라이빗 공간
description: 바른자리가 만들어진 이유와 브랜드 스토리, 그리고 오픈 초기 운영 기준과 공간 철학을 소개합니다.
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
