# Bareunjari repository instructions for Copilot / AI

These instructions apply to repository edits. Prefer the smallest safe change that preserves the current production behavior.

## 1. Business and product principle

- Bareunjari is a private rental space where the customer has exclusive use of the space during the booked time.
- Do not turn the site into separate businesses for each use case. Interview practice, speaking, study, meetings, project work, photography and personal time are examples of needs for private independent space.
- Do not invent facilities, equipment, services, testimonials, statistics, discounts or operational promises that are not confirmed in the repository or current operating data.
- Do not create new content merely to increase article count. Check existing posts/hubs first and prefer strengthening, merging, observing or excluding when search intent overlaps.

## 2. Read existing sources before editing

Before creating new data structures or hardcoding operational facts, inspect the existing source of truth.

Primary sources:

- `_data/operations.yml`: branch information, capacity, prices, product names, hours, parking, promotion and product booking URLs.
- `_data/post_categories.yml`: valid post category allowlist.
- `_data/navigation.yml`: navigation data.
- `_data/seo_pages.yml` and `_data/seo_posts.yml`: SEO data where applicable.
- `_templates/barunjari-blog-post.md`: editorial and production standard for blog posts.
- `docs/architecture/scale-ready-structure.md`: current structural migration plan and phase status.

Do not create `_data/business.yml`, `_data/products.yml`, `_data/booking.yml` or `_data/categories.yml` unless the architecture plan is explicitly changed first.

## 3. Preserve production behavior by default

Do not change the following unless the task explicitly requires it:

- public URLs or `permalink`
- canonical URLs
- search intent of an existing page
- title / description / H1 on a growing page
- booking CTA destination
- GA / Clarity tracking
- JSON-LD type or identifiers
- existing CSS class names or layout structure
- image paths or ALT text without a content reason

Internal refactoring should preserve the rendered HTML and user-visible behavior as much as possible.

## 4. Booking links are role-specific

Do not assume there is one universal Naver booking URL.

Different roles may include:

- internal booking hub: `/booking/`
- hourly/product booking URL
- overnight product booking URL
- general Naver place/booking URL
- map URL
- Naver TalkTalk URL

Before changing a booking link, identify its current role and preserve its destination unless the task is explicitly a booking-UX change.

## 5. Content and category rules

- Every normal content post in `_posts/` should use a category allowed by `_data/post_categories.yml`.
- Redirect/noindex stubs such as `layout: null` + `sitemap: false` are not normal content posts and should not be forced to carry editorial metadata.
- Do not normalize old/new category names across all posts as a side effect of another task.
- Check for search-intent cannibalization before adding a new post.
- Follow `_templates/barunjari-blog-post.md` for new or materially rewritten content.
- Prefer existing shared UI/CSS over creating post-specific CSS.

## 6. Operational facts and hardcoding

For price, duration, capacity, parking, branch address, promotions and product booking URLs:

1. check `_data/operations.yml` first;
2. reuse existing values when the page already consumes that data;
3. do not create a second source of truth;
4. do not mass-refactor hardcoded values unless the task specifically calls for it and the rendered result can be verified.

A value appearing in one or two stable places does not automatically justify structural refactoring.

## 7. Protected / higher-risk areas

Treat structural edits in these areas as higher risk and keep them narrowly scoped:

- `_layouts/**`
- `_includes/**`
- `styles/**`
- `scripts/**`
- `supabase/**`
- `.github/workflows/**`

Do not perform broad cleanup, framework replacement, URL migration or site-wide redesign as a side effect of a small content or data request.

## 8. Validation is mandatory after repository edits

For local validation run:

```bash
bash scripts/predeploy-check.sh
```

The GitHub Pages workflow also validates the already rendered `_site` before deployment.

A failed validation is a signal to inspect the failure. Do not weaken or delete a validation rule just to make CI green without confirming whether it is an obsolete check, a redirect-stub exception, or a real production defect.

## 9. Change strategy

Use this order:

1. inspect current implementation;
2. identify the existing source of truth;
3. make the smallest change;
4. preserve rendered output when the task is structural;
5. run validation;
6. report what changed and what was intentionally left unchanged.

If a proposed refactor does not materially improve booking reliability, operating efficiency, error reduction or multi-location maintainability, prefer leaving the current working implementation alone.
