#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGES_DIR="$ROOT_DIR/images"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/add-image.sh <source-file> [options]

Example:
  bash scripts/add-image.sh ~/Desktop/room.jpg --name interview-room --alt "화상면접용 프라이빗룸"

Options:
  --name "..."            Output base filename without extension (default: source name)
  --alt "..."             Alt text for generated HTML snippet (default: 바른자리 공간 이미지)
  --lazy                   Use loading="lazy" (default)
  --eager                  Use loading="eager"
  --dry-run                Show what would be created without writing files
  -h, --help               Show help

Output:
- images/<name>.jpg (always)
- images/<name>.webp (if cwebp is installed)
- HTML snippet printed to terminal and copied to clipboard on macOS
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 1 ]]; then
  usage
  exit 0
fi

source_file="$1"
shift

output_name=""
alt_text="바른자리 공간 이미지"
loading="lazy"
dry_run="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      output_name="${2:-}"
      shift 2
      ;;
    --alt)
      alt_text="${2:-}"
      shift 2
      ;;
    --lazy)
      loading="lazy"
      shift
      ;;
    --eager)
      loading="eager"
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

if [[ ! -f "$source_file" ]]; then
  echo "[ERROR] Source file not found: $source_file"
  exit 1
fi

if [[ -z "$output_name" ]]; then
  base_name="$(basename "$source_file")"
  output_name="${base_name%.*}"
fi

if [[ ! "$output_name" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo "[ERROR] Invalid --name: $output_name"
  echo "        Use letters, numbers, dot, underscore, hyphen only."
  exit 1
fi

mkdir -p "$IMAGES_DIR"

jpg_path="$IMAGES_DIR/${output_name}.jpg"
webp_path="$IMAGES_DIR/${output_name}.webp"

if [[ "$dry_run" == "true" ]]; then
  echo "[DRY-RUN] Would create: $jpg_path"
  if command -v cwebp >/dev/null 2>&1; then
    echo "[DRY-RUN] Would create: $webp_path"
  else
    echo "[INFO] cwebp not found. WebP output would be skipped."
  fi
else
  # macOS built-in converter to JPEG
  sips -s format jpeg "$source_file" --out "$jpg_path" >/dev/null

  if command -v cwebp >/dev/null 2>&1; then
    cwebp -quiet -q 82 "$source_file" -o "$webp_path"
  else
    echo "[INFO] cwebp not found. Skipped WebP generation."
  fi
fi

if [[ "$dry_run" == "true" ]]; then
  width="1600"
  height="1200"
else
  width="$(sips -g pixelWidth "$jpg_path" 2>/dev/null | awk '/pixelWidth:/ {print $2; exit}')"
  height="$(sips -g pixelHeight "$jpg_path" 2>/dev/null | awk '/pixelHeight:/ {print $2; exit}')"
fi

if [[ -z "$width" || -z "$height" ]]; then
  width="1600"
  height="1200"
fi

relative_jpg="images/${output_name}.jpg"
relative_webp="images/${output_name}.webp"

if [[ -f "$webp_path" || "$dry_run" == "true" ]]; then
  snippet="<picture>\n  <source srcset=\"${relative_webp}\" type=\"image/webp\" />\n  <img src=\"${relative_jpg}\" alt=\"${alt_text}\" loading=\"${loading}\" width=\"${width}\" height=\"${height}\" />\n</picture>"
else
  snippet="<img src=\"${relative_jpg}\" alt=\"${alt_text}\" loading=\"${loading}\" width=\"${width}\" height=\"${height}\" />"
fi

echo
if [[ "$dry_run" == "true" ]]; then
  echo "[DRY-RUN] Done."
else
  echo "[OK] Done."
fi
echo "- JPG : ${relative_jpg}"
if [[ -f "$webp_path" || "$dry_run" == "true" ]]; then
  echo "- WEBP: ${relative_webp}"
fi
echo
echo "[HTML snippet]"
printf '%b\n' "$snippet"

if command -v pbcopy >/dev/null 2>&1; then
  printf '%b\n' "$snippet" | pbcopy
  echo
  echo "[OK] HTML snippet copied to clipboard."
fi
