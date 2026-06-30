#!/usr/bin/env bash

set -euo pipefail

ACTIVE_REPO="/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets"
DEFAULT_DEST_BASE="/Users/wuwoo/Desktop/work/_育英星宠/backup"
DRY_RUN=0
SHOW_PROGRESS=0
DEST_BASE="$DEFAULT_DEST_BASE"
SNAPSHOT_NAME=""

usage() {
  cat <<'EOF'
用法：
  ./local-code-snapshot.sh [--dry-run] [--progress] [--dest DIR] [--name NAME]

说明：
  - 只能在 YuYingPets 主仓库根目录运行。
  - 默认写入父目录 backup 下的时间戳快照目录。
  - 不执行任何 Git 操作。
  - 默认排除 .git、node_modules、dist、build、release、logs、tmp、缓存和本地环境。
  - --dry-run 只预览将要复制的内容，不创建快照。
  - --progress 显示 rsync 单文件进度，输出会比较多。

示例：
  ./local-code-snapshot.sh
  ./local-code-snapshot.sh --dry-run
  ./local-code-snapshot.sh --dest /Users/wuwoo/Desktop/work/_育英星宠/backup
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --progress)
      SHOW_PROGRESS=1
      shift
      ;;
    --dest)
      if [ "${2:-}" = "" ]; then
        echo "错误：--dest 需要一个目录参数。"
        exit 1
      fi
      DEST_BASE="$2"
      shift 2
      ;;
    --name)
      if [ "${2:-}" = "" ]; then
        echo "错误：--name 需要一个目录名参数。"
        exit 1
      fi
      SNAPSHOT_NAME="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "错误：未知参数：$1"
      usage
      exit 1
      ;;
  esac
done

if ! command -v rsync >/dev/null 2>&1; then
  echo "错误：未找到 rsync。"
  exit 1
fi

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

case "$DEST_BASE" in
  "$ACTIVE_REPO"|"$ACTIVE_REPO"/*)
    echo "错误：快照目标不能放在源仓库内部，否则容易递归复制。"
    exit 1
    ;;
  */archive|*/archive/*)
    echo "错误：快照目标不能放在 archive 归档区。"
    exit 1
    ;;
esac

DEST_BASE="$(cd "$(dirname "$DEST_BASE")" && pwd)/$(basename "$DEST_BASE")"
TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
if [ "$SNAPSHOT_NAME" = "" ]; then
  SNAPSHOT_NAME="YuYingPets-code-snapshot-$TIMESTAMP"
fi
DEST_DIR="$DEST_BASE/$SNAPSHOT_NAME"

if [ -e "$DEST_DIR" ]; then
  echo "错误：目标快照目录已存在：$DEST_DIR"
  exit 1
fi

EXCLUDES=(
  "--exclude=.git/"
  "--exclude=.DS_Store"
  "--exclude=**/.DS_Store"
  "--exclude=._*"
  "--exclude=**/._*"
  "--exclude=node_modules/"
  "--exclude=**/node_modules/"
  "--exclude=dist/"
  "--exclude=**/dist/"
  "--exclude=build/"
  "--exclude=**/build/"
  "--exclude=coverage/"
  "--exclude=**/coverage/"
  "--exclude=release/"
  "--exclude=**/release/"
  "--exclude=.deploy/"
  "--exclude=.vite/"
  "--exclude=**/.vite/"
  "--exclude=tmp/"
  "--exclude=**/tmp/"
  "--exclude=.cache/"
  "--exclude=**/.cache/"
  "--exclude=logs/"
  "--exclude=**/logs/"
  "--exclude=.venv/"
  "--exclude=**/.venv/"
  "--exclude=.codex-venv/"
  "--exclude=.venv-imagegen/"
  "--exclude=.gemini_scratch/"
  "--exclude=**/.gemini_scratch/"
  "--exclude=*.log"
  "--exclude=*.tsbuildinfo"
  "--exclude=*.db-shm"
  "--exclude=*.db-wal"
  "--exclude=backend/prisma/dev.db"
  "--exclude=display-app/e2e/artifacts/"
  "--exclude=codex_self_distillation_universal_v1*/"
)

RSYNC_ARGS=(-a --human-readable --stats)
if [ "$DRY_RUN" = "1" ]; then
  RSYNC_ARGS=(-an --human-readable --stats)
fi
if [ "$SHOW_PROGRESS" = "1" ]; then
  RSYNC_ARGS+=("--progress")
fi

echo "源目录：$ACTIVE_REPO"
echo "目标目录：$DEST_DIR"
echo "模式：$([ "$DRY_RUN" = "1" ] && echo dry-run || echo create)"
echo

if [ "$DRY_RUN" = "0" ]; then
  mkdir -p "$DEST_BASE"
  mkdir "$DEST_DIR"
fi

rsync "${RSYNC_ARGS[@]}" "${EXCLUDES[@]}" "$ACTIVE_REPO/" "$DEST_DIR/"

if [ "$DRY_RUN" = "1" ]; then
  echo
  echo "dry-run：未创建快照。"
  exit 0
fi

MANIFEST="$DEST_DIR/SNAPSHOT_MANIFEST.txt"
{
  echo "YuYingPets 本地代码快照"
  echo "生成时间：$(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "源目录：$ACTIVE_REPO"
  echo "目标目录：$DEST_DIR"
  echo
  echo "排除规则："
  printf '%s\n' "${EXCLUDES[@]}"
} >"$MANIFEST"

ln -sfn "$DEST_DIR" "$DEST_BASE/YuYingPets-code-snapshot-latest"

echo
echo "快照完成：$DEST_DIR"
echo "最新快照链接：$DEST_BASE/YuYingPets-code-snapshot-latest"
