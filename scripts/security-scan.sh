#!/usr/bin/env bash
set -euo pipefail

blocked_paths='(^|/)(\.env($|\.)|\.dev\.vars$|\.npmrc$|\.netrc$|.*\.(pem|p8|p12|key|crt|csr|dump|backup|sqlite|sqlite3|db)$|id_rsa$|id_ed25519$|credentials\.[^/]+$|secrets\.[^/]+$|service-account.*\.json$|firebase-adminsdk.*\.json$)'
secret_patterns='(BEGIN (RSA|OPENSSH|PRIVATE) KEY|sk-[A-Za-z0-9_-]{20,}|(AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|CLIENT_SECRET|JWT_SECRET|SESSION_SECRET|SMTP_PASS|PASSWORD|TOKEN|API_KEY)=.+)'

fail=0
staged_count=0
staged_paths=()
while IFS= read -r path; do
  staged_paths+=("$path")
  staged_count=$((staged_count + 1))
done < <(git diff --cached --name-only --diff-filter=ACMR)

if (( staged_count == 0 )); then
  exit 0
fi

for path in "${staged_paths[@]}"; do
  case "$path" in
    .env.example|.env.sample) continue ;;
  esac

  if [[ "$path" =~ $blocked_paths ]]; then
    printf 'Blocked sensitive file path: %s\n' "$path" >&2
    fail=1
  fi
done

if (( staged_count > 0 )); then
  if git grep --cached -n -I -E "$secret_patterns" -- "${staged_paths[@]}" ':(exclude).env.example' ':(exclude).env.sample' >/tmp/blog-security-scan-matches 2>/dev/null; then
    printf 'Blocked possible secret value in staged content:\n' >&2
    sed 's/:.*$//' /tmp/blog-security-scan-matches | sort -u >&2
    fail=1
  fi
fi

rm -f /tmp/blog-security-scan-matches

if [[ "$fail" -ne 0 ]]; then
  printf '\nCommit blocked. Move secrets to local env files or GitHub Secrets, then stage again.\n' >&2
  exit 1
fi
