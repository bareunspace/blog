#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_RUBY_BIN="$ROOT_DIR/vendor/ruby-3.3.11/bin"
if [[ -x "$PROJECT_RUBY_BIN/ruby" ]]; then
  export PATH="$PROJECT_RUBY_BIN:$PATH"
fi

PREVIEW_URL="http://127.0.0.1:4000"

echo "== 1-minute check with preview =="
echo "Step 1/2: jekyll build"
bundle exec jekyll build

echo "Step 2/2: start preview server"
echo "Preview URL: $PREVIEW_URL"
echo "Open the URL in your browser and check manually"
echo "Stop server with Ctrl+C"

exec bundle exec jekyll serve --livereload --host 127.0.0.1 --port 4000
