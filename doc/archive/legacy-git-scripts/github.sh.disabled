#!/usr/bin/env bash

set -euo pipefail

# 单仓库 GitHub 备份脚本
# 用法：
#   ./github.sh
#   ./github.sh --dry-run
#   ./github.sh backup/stable "backup: 2026-05-23 21:30"
#   ./github.sh backup/stable "backup: 2026-05-23 21:30" --tag

usage() {
  cat <<'EOF'
用法：
  ./github.sh [branch] [commit-message] [--tag] [--dry-run]

示例：
  ./github.sh
  ./github.sh --dry-run
  ./github.sh backup/stable "backup: 2026-05-23 21:30"
  ./github.sh backup/stable "backup: 2026-05-23 21:30" --tag

说明：
  - 默认推送当前 Git 分支。
  - --dry-run 只展示将备份的变更，不提交、不推送。
  - --tag 会为本次提交创建 backup-YYYYmmdd-HHMMSS 标签并推送。
EOF
}

if ! command -v git >/dev/null 2>&1; then
  echo "错误：未检测到 git，请先安装 Git。"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "错误：当前目录不是 Git 仓库：$PROJECT_ROOT"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
if [ "$REPO_ROOT" != "$PROJECT_ROOT" ]; then
  echo "错误：请在项目仓库根目录运行脚本：$REPO_ROOT"
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [ -z "$CURRENT_BRANCH" ]; then
  echo "错误：当前处于 detached HEAD 状态，请先切换到备份分支。"
  exit 1
fi

DRY_RUN=0
CREATE_TAG=0
POSITIONAL=()

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    --tag)
      CREATE_TAG=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      POSITIONAL+=("$arg")
      ;;
  esac
done

BRANCH="${POSITIONAL[0]:-$CURRENT_BRANCH}"
COMMIT_MESSAGE="${POSITIONAL[1]:-backup: $(date '+%Y-%m-%d %H:%M')}"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "错误：未配置 origin 远程仓库。"
  exit 1
fi

REMOTE_URL="$(git remote get-url origin)"

echo "项目目录：$PROJECT_ROOT"
echo "当前分支：$CURRENT_BRANCH"
echo "目标分支：$BRANCH"
echo "远程仓库：$REMOTE_URL"
echo

echo "备份前工作区状态："
if git status --short --untracked-files=all | sed -n '1,200p'; then
  :
fi

if [ "$(git status --porcelain --untracked-files=all | wc -l | tr -d ' ')" -gt 200 ]; then
  echo "... 已省略更多变更，请用 git status --short --untracked-files=all 查看完整列表。"
fi

if [ "$DRY_RUN" = "1" ]; then
  echo
  echo "dry-run：未执行 git add、commit、push。"
  exit 0
fi

git add -A

if git diff --cached --quiet; then
  echo
  echo "没有检测到可提交的变更。"
else
  echo
  echo "已暂存以下变更："
  git diff --cached --name-status | sed -n '1,200p'
  if [ "$(git diff --cached --name-only | wc -l | tr -d ' ')" -gt 200 ]; then
    echo "... 已省略更多暂存文件。"
  fi

  git commit -m "$COMMIT_MESSAGE"
fi

if [ "$CREATE_TAG" = "1" ]; then
  TAG_NAME="backup-$(date '+%Y%m%d-%H%M%S')"
  git tag "$TAG_NAME"
  echo "已创建标签：$TAG_NAME"
fi

echo
echo "开始推送到 GitHub..."
git push --progress -u origin "HEAD:$BRANCH"

if [ "$CREATE_TAG" = "1" ]; then
  git push --progress origin "$TAG_NAME"
fi

echo "GitHub 备份完成。"
