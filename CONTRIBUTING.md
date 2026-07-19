# Contributing Guide

## Branch strategy

- Do not commit directly to `main`.
- Create a working branch: `feature/*` or `hotfix/*`.

## Commit strategy

- Commit as often as needed on your working branch.
- Keep commit messages short and action-oriented.

## Merge strategy

- Always merge PRs with **Squash and merge**.
- Target output on `main`: one clean commit per feature/fix.

## Release strategy

- Update `VERSION` and `CHANGELOG.md` for each release.
- Tag only release commits (example: `v1.0.1`).

## Recommended flow

1. Create branch from `main`.
2. Work and commit freely.
3. Open PR.
4. Squash and merge.
5. Run release steps from `docs/release-versioning.md`.

## Content Guidelines

- When creating content, aim for a sensibility that appeals to individuals in their 20s and 30s.
