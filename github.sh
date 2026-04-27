#!/usr/bin/env bash

set -euo pipefail

# 一键备份脚本（安全版）
# 用法：
#   ./github.sh
#   ./github.sh backup/stable "backup: 2026-04-28 23:00"
#   ./github.sh backup/stable "backup: 2026-04-28 23:00" --tag

DEFAULT_BRANCH="backup/stable"
BRANCH="${1:-$DEFAULT_BRANCH}"
COMMIT_MESSAGE="${2:-backup: $(date '+%Y-%m-%d %H:%M')}"
CREATE_TAG="${3:-}"

if ! command -v git >/dev/null 2>&1; then
  echo "错误：未检测到 git，请先安装 Git。"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

if [ ! -d ".git" ]; then
  echo "错误：当前目录不是 Git 仓库，不执行自动初始化。"
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "错误：未配置 origin 远程，请先手动配置后再执行。"
  exit 1
fi

REMOTE_URL="$(git remote get-url origin)"
echo "项目目录：$PROJECT_ROOT"
echo "目标分支：$BRANCH"
echo "远程仓库：$REMOTE_URL"

# 切换/创建备份分支
CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    git checkout "$BRANCH"
  elif git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    git checkout -b "$BRANCH" --track "origin/$BRANCH"
  else
    git checkout -b "$BRANCH"
  fi
fi

git add -A

if git diff --cached --quiet; then
  echo "没有检测到可提交的变更。"
else
  git commit -m "$COMMIT_MESSAGE"
fi

echo "推送分支到 GitHub..."
git push -u origin "$BRANCH"

if [ "$CREATE_TAG" = "--tag" ]; then
  TAG_NAME="backup-$(date '+%Y%m%d-%H%M')"
  git tag -a "$TAG_NAME" -m "snapshot $TAG_NAME"
  git push origin "$TAG_NAME"
  echo "已创建并推送标签：$TAG_NAME"
fi

echo "备份完成。"
