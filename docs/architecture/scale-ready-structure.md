# Scale-ready structure for this repository

This guide keeps your current VS Code + Git workflow and adds a path to grow without migration pain.

## Current operating mode

- Edit HTML/CSS/JS directly in VS Code.
- Deploy by pushing to GitHub Pages.
- Keep runtime behavior unchanged.

## Target directory map

```text
.
├── content/
│   ├── pages/      # long-lived page source notes/drafts
│   ├── posts/      # future articles/news items
│   └── notices/    # short announcements
├── data/
│   ├── navigation/
│   │   └── main.json
│   └── seo/
│       └── defaults.json
├── docs/
│   └── architecture/
│       └── scale-ready-structure.md
├── scripts/
│   ├── main.js
│   └── predeploy-check.sh
├── styles/
│   └── main.css
├── index.html
└── about.html
```

## Why this helps when the site grows

1. Content and presentation are separated early.
2. SEO defaults become centralized instead of duplicated per page.
3. Navigation changes can be made in one JSON file later.
4. You can add generation scripts gradually without replacing the current site.

## Phased migration plan

### Phase 1 (now)

- Keep `index.html` and `about.html` as the production source.
- Start storing reusable metadata in `data/`.
- Store new article drafts under `content/posts/`.

### Phase 2 (20-50 pages)

- Add a small build script to read `data/navigation/main.json` and inject nav into pages.
- Add page-level front matter or JSON sidecars for title/description/canonical.
- Auto-generate sitemap from page metadata.

### Phase 3 (multi-editor / frequent publishing)

- Consider CMS only if needed.
- If CMS is adopted, connect it to `content/posts/` first, not entire site.

## Operational rules

1. Keep canonical URLs absolute in page head tags.
2. Keep one source of truth for nav and SEO defaults in `data/`.
3. Treat `docs/architecture/` as decision logs before structural changes.
4. Avoid large rewrites; prefer incremental scripts.

## Trigger points for the next step

Move to Phase 2 when any of these happen:

- 20+ pages exist.
- Same nav/SEO edit is repeated in 3+ files.
- Publishing frequency reaches weekly.

Move to Phase 3 when any of these happen:

- 2+ people publish content.
- Non-developer editors need browser-based editing.
- Review and approval flow is required.
