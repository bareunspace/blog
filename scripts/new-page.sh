#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/new-page.sh <slug> "<title>" "<description>" [options]

Example:
  bash scripts/new-page.sh faq "자주 묻는 질문 | 바른자리" "이용 전 자주 묻는 질문을 확인하세요." --keywords "부천공간대여,바른자리,FAQ" --add-sitemap

Notes:
- slug: letters, numbers, and hyphen only (e.g., faq, pricing-guide)
- file will be created as <slug>.html in repository root

Options:
  --keywords "..."        SEO keywords (default: 부천공간대여,바른자리,<slug>)
  --label "..."           Section label text (default: New Page)
  --add-nav                Automatically add link in _includes/header.html
  --nav-label "..."       Navigation label text (default: slug)
  --nav-target "..."      Navigation target: home|about|both (default: both)
  --og-image "..."        Absolute image URL for OG (default: main image)
  --og-image-alt "..."    OG image alt text
  --preload-image "..."   Relative preload image path (default: images/main.webp)
  --add-sitemap            Automatically add URL to sitemap.xml
  --changefreq "..."      Sitemap changefreq (default: monthly)
  --priority "..."        Sitemap priority (default: 0.6)
  --run-check              Run predeploy check after generation
  --dry-run                Print planned changes only (no file writes)
  -h, --help               Show help
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 3 ]]; then
  echo "[ERROR] Missing required arguments."
  usage
  exit 1
fi

slug="$1"
title="$2"
description="$3"
shift 3

keywords=""
section_label="New Page"
add_nav="false"
nav_label=""
nav_target="both"
og_image="https://bareunjari.com/images/main.jpeg"
og_image_alt="바른자리 대표 이미지"
preload_image="images/main.webp"
add_sitemap="false"
sitemap_changefreq="monthly"
sitemap_priority="0.6"
run_check="false"
dry_run="false"

# Backward compatibility: allow 4th positional keywords argument.
if [[ $# -gt 0 && "${1:-}" != --* ]]; then
  keywords="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keywords)
      keywords="${2:-}"
      shift 2
      ;;
    --label)
      section_label="${2:-}"
      shift 2
      ;;
    --add-nav)
      add_nav="true"
      shift
      ;;
    --nav-label)
      nav_label="${2:-}"
      shift 2
      ;;
    --nav-target)
      nav_target="${2:-}"
      shift 2
      ;;
    --og-image)
      og_image="${2:-}"
      shift 2
      ;;
    --og-image-alt)
      og_image_alt="${2:-}"
      shift 2
      ;;
    --preload-image)
      preload_image="${2:-}"
      shift 2
      ;;
    --add-sitemap)
      add_sitemap="true"
      shift
      ;;
    --changefreq)
      sitemap_changefreq="${2:-}"
      shift 2
      ;;
    --priority)
      sitemap_priority="${2:-}"
      shift 2
      ;;
    --run-check)
      run_check="true"
      shift
      ;;
    --dry-run)
      dry_run="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ ! "$slug" =~ ^[a-z0-9-]+$ ]]; then
  echo "[ERROR] Invalid slug: $slug"
  echo "        Use lowercase letters, numbers, hyphen only."
  exit 1
fi

if [[ ! "$nav_target" =~ ^(home|about|both)$ ]]; then
  echo "[ERROR] Invalid --nav-target: $nav_target"
  echo "        Allowed values: home, about, both"
  exit 1
fi

if [[ ! "$sitemap_priority" =~ ^(0(\.[0-9]+)?|1(\.0+)?)$ ]]; then
  echo "[ERROR] Invalid --priority: $sitemap_priority"
  echo "        Allowed range: 0.0 ~ 1.0"
  exit 1
fi

if [[ ! "$og_image" =~ ^https:// ]]; then
  echo "[WARN] og-image is not https URL: $og_image"
fi

if [[ ${#title} -gt 70 ]]; then
  echo "[WARN] title is long (${#title} chars). Recommended under 60-70 chars."
fi

if [[ ${#description} -gt 170 ]]; then
  echo "[WARN] description is long (${#description} chars). Recommended under 150-170 chars."
fi

file_path="$ROOT_DIR/${slug}.html"
canonical_url="https://bareunjari.com/${slug}.html"

if [[ -e "$file_path" ]]; then
  echo "[ERROR] File already exists: ${slug}.html"
  exit 1
fi

if [[ -z "$keywords" ]]; then
  keywords="부천공간대여,바른자리,${slug}"
fi

if [[ -z "$nav_label" ]]; then
  nav_label="$slug"
fi

css_version="$(grep -m1 '^css_version:' "$ROOT_DIR/index.html" | sed -E 's/^css_version:[[:space:]]*//')"
script_version="$(grep -m1 '^script_version:' "$ROOT_DIR/index.html" | sed -E 's/^script_version:[[:space:]]*//')"

if [[ -z "$css_version" ]]; then
  css_version="20260710-3"
fi
if [[ -z "$script_version" ]]; then
  script_version="20260710-3"
fi

if [[ "$dry_run" == "true" ]]; then
  echo "[DRY-RUN] Would create: ${slug}.html"
else
cat > "$file_path" <<EOF
---
layout: default
page_id: ${slug}
permalink: /${slug}.html
title: ${title}
description: ${description}
keywords: ${keywords}
canonical: ${canonical_url}
og_image: ${og_image}
og_image_alt: ${og_image_alt}
preload_image: ${preload_image}
css_version: ${css_version}
script_version: ${script_version}
---
<main class="sub-page">
  <section id="${slug}">
    <div class="section-inner">
      <p class="section-label">${section_label}</p>
      <h1 class="section-title">${title}</h1>
      <p class="section-desc">${description}</p>
    </div>
  </section>
</main>
EOF
fi

append_sitemap_entry() {
  local sitemap_path="$ROOT_DIR/sitemap.xml"
  local today
  today="$(date +%Y-%m-%d)"

  if [[ ! -f "$sitemap_path" ]]; then
    echo "[WARN] sitemap.xml not found. Skip sitemap update."
    return
  fi

  if grep -q "<loc>${canonical_url}</loc>" "$sitemap_path"; then
    echo "[INFO] sitemap.xml already contains: ${canonical_url}"
    return
  fi

  local tmp_file
  tmp_file="$(mktemp)"

  awk -v loc="${canonical_url}" -v lastmod="${today}" -v cf="${sitemap_changefreq}" -v pr="${sitemap_priority}" '
    /<\/urlset>/ {
      print "  <url>"
      print "    <loc>" loc "</loc>"
      print "    <lastmod>" lastmod "</lastmod>"
      print "    <changefreq>" cf "</changefreq>"
      print "    <priority>" pr "</priority>"
      print "  </url>"
    }
    { print }
  ' "$sitemap_path" > "$tmp_file"

  if [[ "$dry_run" == "true" ]]; then
    rm -f "$tmp_file"
    echo "[DRY-RUN] Would update sitemap.xml with: ${canonical_url}"
  else
    mv "$tmp_file" "$sitemap_path"
    echo "[OK] Updated sitemap.xml with: ${canonical_url}"
  fi
}

append_nav_entry() {
  local nav_data_path="$ROOT_DIR/_data/navigation.yml"
  local nav_href="${slug}.html"

  if [[ ! -f "$nav_data_path" ]]; then
    echo "[WARN] _data/navigation.yml not found. Skip nav update."
    return
  fi

  if grep -q "href: \"${nav_href}\"" "$nav_data_path"; then
    echo "[INFO] Navigation already contains: ${nav_href}"
    return
  fi

  ruby -ryaml -e '
    path, href, label, target, dry = ARGV
    data = YAML.load_file(path)
    data["home"] ||= []
    data["about"] ||= []

    home_entry = { "label" => label, "href" => href }
    about_entry = { "label" => label, "href" => href }

    home_exists = data["home"].any? { |item| item["href"] == href }
    about_exists = data["about"].any? { |item| item["href"] == href }

    if target == "home" || target == "both"
      data["home"] << home_entry unless home_exists
    end
    if target == "about" || target == "both"
      data["about"] << about_entry unless about_exists
    end

    unless dry == "true"
      File.write(path, YAML.dump(data))
    end
  ' "$nav_data_path" "$nav_href" "$nav_label" "$nav_target" "$dry_run"

  if [[ "$dry_run" == "true" ]]; then
    echo "[DRY-RUN] Would update navigation data with: ${nav_href} (${nav_label}) target=${nav_target}"
  else
    echo "[OK] Updated navigation data with: ${nav_href} (${nav_label}) target=${nav_target}"
  fi
}

if [[ "$add_sitemap" == "true" ]]; then
  append_sitemap_entry
fi

if [[ "$add_nav" == "true" ]]; then
  append_nav_entry
fi

if [[ "$dry_run" == "true" ]]; then
  echo "[DRY-RUN] Generation preview complete"
else
  echo "[OK] Created: ${slug}.html"
fi
echo "[NEXT] 1) Edit ${slug}.html content"
if [[ "$add_nav" == "true" ]]; then
  echo "[NEXT] 2) navigation data updated automatically (_data/navigation.yml)"
else
  echo "[NEXT] 2) Add navigation item in _data/navigation.yml or use --add-nav"
fi
if [[ "$add_sitemap" == "true" ]]; then
  echo "[NEXT] 3) sitemap.xml updated automatically"
else
  echo "[NEXT] 3) Add URL to sitemap.xml or use --add-sitemap"
fi

if [[ "$run_check" == "true" ]]; then
  if [[ "$dry_run" == "true" ]]; then
    echo "[DRY-RUN] Would run: bash scripts/predeploy-check.sh"
  else
    echo "[RUN] bash scripts/predeploy-check.sh"
    bash scripts/predeploy-check.sh
  fi
fi
