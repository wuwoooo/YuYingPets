#!/usr/bin/env bash

set -euo pipefail

ACTIVE_REPO="/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets"
ALLOWED_BRANCH="main"
REMOTE_NAME="backup-origin"
DRY_RUN=0
POSITIONAL=()

usage() {
  cat <<'EOF'
用法：
  ./backup-to-github.sh [commit-message] [--dry-run]

说明：
  - 只能在 YuYingPets 主仓库根目录运行。
  - 只能在 main 分支运行。
  - 只执行 add / commit / push，不执行 pull、fetch、merge、rebase。
  - --dry-run 仅展示将要备份的状态，不提交、不推送。
EOF
}

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
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

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_DIR="$(pwd)"

if [ "$PROJECT_ROOT" != "$ACTIVE_REPO" ]; then
  echo "错误：脚本安装位置异常：$PROJECT_ROOT"
  exit 1
fi

if [ "$CURRENT_DIR" != "$ACTIVE_REPO" ]; then
  echo "错误：请先进入唯一活跃仓库根目录再执行：$ACTIVE_REPO"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "错误：当前目录不是 Git 仓库。"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
CURRENT_BRANCH="$(git branch --show-current)"

if [ "$REPO_ROOT" != "$ACTIVE_REPO" ]; then
  echo "错误：当前仓库不是唯一活跃仓库：$REPO_ROOT"
  exit 1
fi

if [ "$CURRENT_BRANCH" != "$ALLOWED_BRANCH" ]; then
  echo "错误：当前分支为 $CURRENT_BRANCH，只允许在 $ALLOWED_BRANCH 分支备份。"
  exit 1
fi

if ! git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  echo "错误：未找到远程 $REMOTE_NAME。"
  exit 1
fi

REMOTE_URL="$(git remote get-url "$REMOTE_NAME")"
COMMIT_MESSAGE="${POSITIONAL[0]:-backup: $(date '+%Y-%m-%d %H:%M')}"

echo "当前目录：$CURRENT_DIR"
echo "仓库根目录：$REPO_ROOT"
echo "当前分支：$CURRENT_BRANCH"
echo "目标远程：$REMOTE_NAME"
echo "远程地址：$REMOTE_URL"
echo
echo "工作区状态："
git status --short --branch --untracked-files=all | sed -n '1,200p'

if [ "$DRY_RUN" = "1" ]; then
  echo
  echo "dry-run：未执行 git add、git commit、git push。"
  exit 0
fi

echo
printf "输入 YES 才会继续备份到 GitHub："
read -r CONFIRM
if [ "$CONFIRM" != "YES" ]; then
  echo "已取消。"
  exit 1
fi

git add -A

if git diff --cached --quiet; then
  echo "没有新的文件变更，直接推送当前 HEAD。"
else
  echo "即将提交以下变更："
  git diff --cached --name-status | sed -n '1,200p'
  git commit -m "$COMMIT_MESSAGE"
fi

git push --progress "$REMOTE_NAME" "HEAD:$ALLOWED_BRANCH"
echo "备份完成。"
