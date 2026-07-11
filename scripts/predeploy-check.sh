#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pass_count=0
fail_count=0

pass() {
  echo "[PASS] $1"
  pass_count=$((pass_count + 1))
}

fail() {
  echo "[FAIL] $1"
  fail_count=$((fail_count + 1))
}

check_file_exists() {
  local file_path="$1"
  if [[ -f "$file_path" ]]; then
    pass "File exists: $file_path"
  else
    fail "Missing file: $file_path"
  fi
}

check_contains() {
  local file_path="$1"
  local pattern="$2"
  local label="$3"
  if grep -q "$pattern" "$file_path"; then
    pass "$label"
  else
    fail "$label"
  fi
}

echo "== Pre-deploy Check =="

echo "Step 1/6: bundle install (local path)"
bundle install --path vendor/bundle >/dev/null
pass "Bundle install completed"

echo "Step 2/6: sync Naver blog RSS"
if bash scripts/sync-naver-blog.sh >/dev/null; then
  pass "Naver blog RSS sync completed"
else
  fail "Naver blog RSS sync failed"
fi

echo "Step 3/6: jekyll build"
bundle exec jekyll build >/dev/null
pass "Jekyll build completed"

ABOUT_OUTPUT=""
if [[ -f "_site/about.html" ]]; then
  ABOUT_OUTPUT="_site/about.html"
elif [[ -f "_site/about/index.html" ]]; then
  ABOUT_OUTPUT="_site/about/index.html"
fi

echo "Step 4/6: required output files"
check_file_exists "_site/index.html"
if [[ -n "$ABOUT_OUTPUT" ]]; then
  pass "File exists: $ABOUT_OUTPUT"
else
  fail "Missing about page output (_site/about.html or _site/about/index.html)"
fi
check_file_exists "_site/robots.txt"
check_file_exists "_site/sitemap.xml"
check_file_exists "_site/googlebf2d4abd9a14843f.html"
check_file_exists "_site/naver5fe3663045eafa19ecaa866c5476b7a2.html"

echo "Step 5/6: SEO and tracking checks"
check_contains "_site/index.html" 'rel="canonical" href="https://bareunjari.com/"' "Home canonical"
check_contains "_site/index.html" 'G-ECYS2XKQ4H' "Home GA tag"
check_contains "_site/index.html" 'xfmtyp5w3b' "Home Clarity tag"
check_contains "_site/index.html" '"@type": "LocalBusiness"' "Home LocalBusiness JSON-LD"
check_contains "_site/index.html" '"@type": "FAQPage"' "Home FAQPage JSON-LD"
if [[ -n "$ABOUT_OUTPUT" ]]; then
  check_contains "$ABOUT_OUTPUT" 'rel="canonical" href="https://bareunjari.com/about.html"' "About canonical"
  check_contains "$ABOUT_OUTPUT" 'G-ECYS2XKQ4H' "About GA tag"
  check_contains "$ABOUT_OUTPUT" 'xfmtyp5w3b' "About Clarity tag"
  check_contains "$ABOUT_OUTPUT" '"@type": "AboutPage"' "About AboutPage JSON-LD"
fi

if grep -Eq '^[[:space:]]*-[[:space:]]title:' _data/naver_blog.yml; then
  pass "Naver blog data has at least one post"
else
  fail "Naver blog data is empty"
fi

echo "Step 6/6: rendered HTML sanity"
if grep -R -n '{{\|{%' _site/*.html >/dev/null 2>&1; then
  fail "Found unresolved Liquid tags in _site HTML"
else
  pass "No unresolved Liquid tags in _site HTML"
fi

echo
echo "== Summary =="
echo "Passed: $pass_count"
echo "Failed: $fail_count"

if [[ "$fail_count" -gt 0 ]]; then
  echo "Pre-deploy check failed."
  exit 1
fi

echo "Pre-deploy check passed."
