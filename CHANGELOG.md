# Changelog

All notable changes to this project will be documented in this file.

This project follows Semantic Versioning.

## [Unreleased]
### Added
- `docs/weekly-publishing-workflow.md` with weekly cadence, publishing SOP, copy-paste article template, and weekly KPI retrospective template.
- `interview-prep-checklist.html` added as an onsite Jekyll article for interview preparation (non-Naver content).
- `_posts/2026-07-13-interview-prep-checklist-12.md` added as the first `_posts`-based onsite article.

### Changed
- `_includes/header.html` now supports dedicated navigation for `page_id: interview` pages.
- `_data/navigation.yml` includes `interview` navigation items and a new `blog-onsite` anchor for `blog` navigation.
- `blog.html` now contains an onsite-published article section linking to `interview-prep-checklist.html`.
- `blog.html` now auto-renders onsite articles from `site.posts` for `_posts`-based publishing.
- `_includes/header.html` and `_data/navigation.yml` now support a dedicated navigation set for post pages (`page.collection == "posts"`).
- Shared links and asset paths in `_includes/head.html`, `_includes/header.html`, and `_includes/footer.html` were made root-relative to prevent 404 issues on nested post URLs.
- `index.html` video interview panel now auto-renders related interview posts from `_posts` and links to the onsite blog list.
- Added a global breadcrumb component (`Home > ...`) via `_includes/breadcrumb.html`, rendered from `_layouts/default.html` for non-home pages.
- Breadcrumb placement moved from global header area to directly below each page hero section on key pages (`about`, `blog`, `interview`, and current `_posts` article).
- Enhanced `_posts/2026-07-13-interview-prep-checklist-12.md` with practical interview prep content including answer frameworks, common mistakes, final check routine, and 1-minute self-introduction examples.
- Expanded `_posts/2026-07-13-interview-prep-checklist-12.md` with a dedicated AI interview practice guide (practice routine, delivery tips, and self-scoring criteria).
- Improved post SEO in `_includes/head.html` with dynamic `robots`, `og:type=article` for posts, and post-specific JSON-LD include.
- Added `_includes/jsonld-post.html` for `BlogPosting` structured data on `_posts` content.
- Canonicalized `interview-prep-checklist.html` to `/posts/interview-prep-checklist/` and marked it `noindex` to reduce duplicate indexing risk.

## [1.0.0] - 2026-07-11
### Added
- Baseline versioning policy introduced.
- `VERSION` file added for explicit release tracking.
- `scripts/new-page.sh` workflow established for page generation.
- Data-driven navigation via `_data/navigation.yml`.

### Changed
- Project release management restarted from a clean baseline (`1.0.0`).

### Fixed
- N/A
