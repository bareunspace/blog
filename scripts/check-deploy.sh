#!/usr/bin/env bash
set -euo pipefail

# 스크립트가 위치한 디렉터리를 기준으로 프로젝트 루트 디렉터리 설정
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POSTS_DIR="$ROOT_DIR/_posts"

# ANSI 색상 코드
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m' # No Color

echo -e "${COLOR_YELLOW}배포 상태 확인을 시작합니다...${COLOR_NC}"

# 1. _posts 디렉터리에서 가장 최근에 수정된 파일 찾기
latest_post=$(find "$POSTS_DIR" -type f -name "*.md" -print0 | xargs -0 ls -t | head -n 1)

if [[ -z "$latest_post" ]]; then
  echo -e "${COLOR_RED}오류: _posts 디렉터리에서 게시글을 찾을 수 없습니다.${COLOR_NC}"
  exit 1
fi

echo "- 최신 게시글: $(basename "$latest_post")"

# 2. 해당 파일에서 title 추출 (따옴표 제거 포함)
post_title=$(grep -m1 '^title:' "$latest_post" | sed -e 's/^title:[[:space:]]*//' -e 's/"//g')

if [[ -z "$post_title" ]]; then
  echo -e "${COLOR_RED}오류: 게시글 파일에서 'title:'을 찾을 수 없습니다.${COLOR_NC}"
  exit 1
fi

echo "- 게시글 제목: ${post_title}"

# 3. 블로그 메인 페이지(blog.html)를 다운로드하여 내용 확인
BLOG_URL="https://bareunjari.com/blog.html"
echo "- 확인 대상 URL: ${BLOG_URL}"

# 캐시를 무시하고 항상 최신 버전을 가져오기 위해 curl 옵션 추가
site_content=$(curl -s -L -H "Cache-Control: no-cache" -H "Pragma: no-cache" "$BLOG_URL")

# 4. 다운로드한 내용에 게시글 제목이 포함되어 있는지 확인
if echo "$site_content" | grep -q -F "$post_title"; then
  echo -e "\n${COLOR_GREEN}[성공] 사이트에 최신 게시글이 반영되었습니다! 🎉${COLOR_NC}"
  # 블로그 페이지에서 해당 라인과 주변 라인 표시
  echo -e "\n--- 감지된 내용 ---"
  echo "$site_content" | grep -F -C 2 "$post_title"
  echo "--------------------"

  # 삭제된 글이 여전히 남아있는지 추가로 확인
  DELETED_POST_TITLE="면접관은 정답을 기대하지 않습니다"
  if echo "$site_content" | grep -q -F "$DELETED_POST_TITLE"; then
    echo -e "\n${COLOR_RED}[경고] 삭제된 게시글이 아직 사이트에 남아있습니다.${COLOR_NC}"
    echo "      브라우저에서 강력 새로고침(Ctrl+Shift+R 또는 Cmd+Shift+R)을 해보세요."
  fi

  exit 0
else
  echo -e "\n${COLOR_RED}[실패] 아직 사이트에 최신 게시글이 반영되지 않았습니다.${COLOR_NC}"
  echo "잠시 후 다시 시도해 보세요. (빌드 및 배포에 몇 분 정도 소요될 수 있습니다)"
  exit 1
fi