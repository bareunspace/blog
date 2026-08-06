#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/images/uploads"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/upload-community-image.sh <source-file> [options]

Example:
  bash scripts/upload-community-image.sh ~/Desktop/group-photo.jpg --name interview-practice-aug

Options:
  --name <slug>         Output filename without extension (default: source filename)
  --max-bytes <bytes>   Max output size in bytes (default: 350000)
  --max-width <px>      Resize longest side to this width before conversion (default: 1600)
  --keep-source         Keep original source file (default: delete original)
  -h, --help            Show help

Output:
  images/uploads/<name>.webp

Notes:
- Converts to WebP only.
- Deletes original source by default to keep repository size small.
- Requires macOS `sips` and `cwebp`.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 1 ]]; then
  usage
  exit 0
fi

source_file="$1"
shift

output_name=""
max_bytes=350000
max_width=1600
delete_source="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      output_name="${2:-}"
      shift 2
      ;;
    --max-bytes)
      max_bytes="${2:-}"
      shift 2
      ;;
    --max-width)
      max_width="${2:-}"
      shift 2
      ;;
    --keep-source)
      delete_source="false"
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

if ! command -v sips >/dev/null 2>&1; then
  echo "[ERROR] sips command not found. This script requires macOS built-in sips."
  exit 1
fi

if ! command -v cwebp >/dev/null 2>&1; then
  echo "[ERROR] cwebp command not found. Install with: brew install webp"
  exit 1
fi

if [[ -z "$output_name" ]]; then
  base_name="$(basename "$source_file")"
  output_name="${base_name%.*}"
fi

# Normalize name for safe path usage.
output_name="$(echo "$output_name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//')"

if [[ -z "$output_name" ]]; then
  echo "[ERROR] Output name is empty after normalization. Use --name with letters/numbers."
  exit 1
fi

if [[ ! "$max_bytes" =~ ^[0-9]+$ ]] || [[ "$max_bytes" -le 0 ]]; then
  echo "[ERROR] --max-bytes must be a positive integer"
  exit 1
fi

if [[ ! "$max_width" =~ ^[0-9]+$ ]] || [[ "$max_width" -le 0 ]]; then
  echo "[ERROR] --max-width must be a positive integer"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/community-image.XXXXXX")"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

resized_png="$tmp_dir/resized.png"
# Convert to png first for stable pre-processing.
sips -s format png "$source_file" --out "$resized_png" >/dev/null
# Resize longest side.
sips -Z "$max_width" "$resized_png" >/dev/null

output_path="$OUTPUT_DIR/${output_name}.webp"
candidate_path="$tmp_dir/${output_name}.webp"

best_quality=0
for quality in 84 80 76 72 68 64 60 56; do
  cwebp -quiet -q "$quality" "$resized_png" -o "$candidate_path"
  size_bytes="$(wc -c < "$candidate_path" | tr -d ' ')"

  if [[ "$size_bytes" -le "$max_bytes" ]]; then
    best_quality="$quality"
    mv "$candidate_path" "$output_path"
    break
  fi
done

if [[ "$best_quality" -eq 0 ]]; then
  echo "[ERROR] Could not fit image into ${max_bytes} bytes even at low quality."
  echo "        Try a smaller source image or lower --max-width/--max-bytes constraints."
  exit 1
fi

if [[ "$delete_source" == "true" ]]; then
  rm -f "$source_file"
fi

relative_path="images/uploads/${output_name}.webp"
final_size="$(wc -c < "$output_path" | tr -d ' ')"

echo "[OK] Community image prepared"
echo "- Path: $relative_path"
echo "- Size: ${final_size} bytes"
echo "- Quality: q${best_quality}"
if [[ "$delete_source" == "true" ]]; then
  echo "- Source removed: $source_file"
else
  echo "- Source kept: $source_file"
fi
