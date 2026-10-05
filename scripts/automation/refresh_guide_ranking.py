#!/usr/bin/env python3
"""Refresh the "_global_by_performance" ranking in _data/blog_guide_priority.yml
from live Google Search Console data, via the public guide-post-performance
Supabase Edge Function (anon key only -- gsc_page_daily itself is RLS-locked
to service_role, so this script never needs that key).

Run weekly by .github/workflows/guide-ranking-refresh.yml. Only the
auto-generated block at the end of the data file is touched; the hand-curated
per-category sections above it (and their comments) are left byte-for-byte
untouched -- this rewrites that one block as plain text rather than round-
tripping the whole file through a YAML dumper, specifically so it can't
reformat or reorder anything else in the file.
"""
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "_config.yml"
DATA_PATH = ROOT / "_data" / "blog_guide_priority.yml"
MARKER = "# Full ranking by cumulative Google Search Console clicks"
WINDOW_DAYS = 90


def read_config_value(key: str) -> str:
    text = CONFIG_PATH.read_text(encoding="utf-8")
    match = re.search(rf'^{re.escape(key)}:\s*"?([^"\n]+)"?\s*$', text, flags=re.MULTILINE)
    if not match:
        raise RuntimeError(f"{key} not found in _config.yml")
    return match.group(1).strip()


def fetch_performance_rows(supabase_url: str, anon_key: str, days: int) -> list[dict]:
    url = f"{supabase_url}/functions/v1/guide-post-performance?days={days}"
    req = urllib.request.Request(url, headers={"apikey": anon_key, "Authorization": f"Bearer {anon_key}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"guide-post-performance returned HTTP {exc.code}: {exc.read().decode('utf-8', 'replace')}") from exc
    if not payload.get("ok"):
        raise RuntimeError(f"guide-post-performance returned an error payload: {payload}")
    return payload["rows"]


def find_redirect_stubs() -> dict[str, str]:
    """Map each posts/*/index.html redirect stub's own permalink to its
    canonical redirect target, by reading the meta-refresh tag directly."""
    stubs: dict[str, str] = {}
    posts_dir = ROOT / "posts"
    if not posts_dir.is_dir():
        return stubs
    for index_file in posts_dir.glob("*/index.html"):
        text = index_file.read_text(encoding="utf-8")
        if 'http-equiv="refresh"' not in text:
            continue
        permalink_match = re.search(r'^permalink:\s*(\S+)\s*$', text, flags=re.MULTILINE)
        target_match = re.search(r'http-equiv="refresh"\s+content="0;\s*url=([^"]+)"', text)
        if permalink_match and target_match:
            stubs[permalink_match.group(1)] = target_match.group(1)
    return stubs


def merge_redirect_stubs(rows: list[dict], stubs: dict[str, str]) -> list[dict]:
    totals: dict[str, dict] = {}
    for row in rows:
        url = stubs.get(row["url"], row["url"])
        entry = totals.setdefault(url, {"url": url, "clicks": 0, "impressions": 0})
        entry["clicks"] += row["clicks"]
        entry["impressions"] += row["impressions"]
    merged = list(totals.values())
    merged.sort(key=lambda r: (-r["clicks"], -r["impressions"]))
    return merged


def render_block(rows: list[dict], window_days: int, from_date: str, generated_at: str) -> str:
    lines = [
        MARKER,
        "# (ties broken by impressions), across every post site-wide, sourced from",
        f"# Supabase public.gsc_page_daily over a rolling {window_days}-day window",
        f"# ({from_date} ~ present as of the last refresh). Used only by index.html's",
        "# single combined \"실전 가이드\" grid on the homepage, which (unlike blog.html's",
        "# per-category carousels above) isn't split by category and shows every post",
        "# in one list.",
        "#",
        "# Auto-generated weekly by scripts/automation/refresh_guide_ranking.py via",
        "# .github/workflows/guide-ranking-refresh.yml -- don't hand-edit, it will be",
        "# overwritten on the next run. Redirect stubs under posts/*/ are detected and",
        "# folded into their canonical target automatically (see find_redirect_stubs()",
        "# in that script).",
        f"# Last refreshed: {generated_at}",
        '"_global_by_performance":',
    ]
    for row in rows:
        lines.append(f"  - url: {row['url']}")
        lines.append(f"    clicks: {row['clicks']}")
        lines.append(f"    impressions: {row['impressions']}")
    return "\n".join(lines) + "\n"


def main() -> int:
    supabase_url = read_config_value("supabase_url")
    anon_key = read_config_value("supabase_anon_key")

    rows = fetch_performance_rows(supabase_url, anon_key, WINDOW_DAYS)
    stubs = find_redirect_stubs()
    ranked = merge_redirect_stubs(rows, stubs)

    full_text = DATA_PATH.read_text(encoding="utf-8")
    marker_index = full_text.find(MARKER)
    if marker_index == -1:
        print(f"error: marker {MARKER!r} not found in {DATA_PATH}", file=sys.stderr)
        return 1
    header = full_text[:marker_index]

    now = datetime.now(timezone.utc)
    from_date = (now.date() - timedelta(days=WINDOW_DAYS)).isoformat()
    generated_at = now.strftime("%Y-%m-%d")

    new_block = render_block(ranked, WINDOW_DAYS, from_date, generated_at)
    DATA_PATH.write_text(header + new_block, encoding="utf-8")

    print(f"Refreshed {len(ranked)} ranked guide posts (window={WINDOW_DAYS}d, stubs merged={len(stubs)}).")
    print("Top 5:")
    for row in ranked[:5]:
        print(f"  {row['clicks']:>4} clicks  {row['impressions']:>6} impr  {row['url']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
