#!/usr/bin/env bash

set -euo pipefail

# 自动同步当前项目到指定 GitHub 仓库
REMOTE_URL="https://github.com/wuwoooo/yuyingpets.git"
DEFAULT_BRANCH="main"

if ! command -v git >/dev/null 2>&1; then
  echo "错误：未检测到 git，请先安装 Git。"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

BRANCH="${1:-$DEFAULT_BRANCH}"
COMMIT_MESSAGE="${2:-chore: sync project to github}"

echo "项目目录：$PROJECT_ROOT"
echo "目标分支：$BRANCH"
echo "远程仓库：$REMOTE_URL"

if [ ! -d ".git" ]; then
  echo "检测到当前目录未初始化 Git，正在初始化..."
  git init
fi

if git remote get-url origin >/dev/null 2>&1; then
  CURRENT_REMOTE="$(git remote get-url origin)"
  if [ "$CURRENT_REMOTE" != "$REMOTE_URL" ]; then
    echo "更新 origin 远程地址：$CURRENT_REMOTE -> $REMOTE_URL"
    git remote set-url origin "$REMOTE_URL"
  fi
else
  echo "添加 origin 远程仓库..."
  git remote add origin "$REMOTE_URL"
fi

# 如果没有 .gitignore，创建一个通用版本，避免提交构建产物与依赖目录
if [ ! -f ".gitignore" ]; then
  cat > ".gitignore" <<'EOF'
# Node
node_modules/
dist/
build/
coverage/
.npm/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Env
.env
.env.*
!.env.example

# OS / IDE
.DS_Store
.idea/
.vscode/
EOF
  echo "已创建默认 .gitignore"
fi

git add -A

if git diff --cached --quiet; then
  echo "没有检测到可提交的变更。"
else
  git commit -m "$COMMIT_MESSAGE"
fi

git branch -M "$BRANCH"
echo "开始推送到 GitHub（首次推送会建立上游分支）..."
git push -u origin "$BRANCH"

echo "同步完成。"
