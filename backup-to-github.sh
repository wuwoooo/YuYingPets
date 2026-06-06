#!/usr/bin/env bash

set -euo pipefail

ACTIVE_REPO="/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets"
ALLOWED_BRANCH="main"
REMOTE_NAME="backup-origin"
DRY_RUN=0
MAX_FILE_MB=95
WARN_FILE_MB=50
STATUS_LIMIT=200
POSITIONAL=()

usage() {
  cat <<'EOF'
用法：
  ./backup-to-github.sh [commit-message] [--dry-run] [--max-file-mb N] [--warn-file-mb N]

说明：
  - 只能在 YuYingPets 主仓库根目录运行。
  - 只能在 main 分支运行。
  - 只执行 add / commit / push，不执行 pull、fetch、merge、rebase。
  - --dry-run 仅展示将要备份的状态，不提交、不推送。
  - 默认阻断单文件超过 95MB 的待提交文件，避免 GitHub 100MB 硬限制。
  - 默认提示单文件超过 50MB 的待提交文件，避免 GitHub 大文件警告。
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --max-file-mb)
      if [ "${2:-}" = "" ]; then
        echo "错误：--max-file-mb 需要一个数字参数。"
        exit 1
      fi
      MAX_FILE_MB="$2"
      shift 2
      ;;
    --warn-file-mb)
      if [ "${2:-}" = "" ]; then
        echo "错误：--warn-file-mb 需要一个数字参数。"
        exit 1
      fi
      WARN_FILE_MB="$2"
      shift 2
      ;;
    --status-limit)
      if [ "${2:-}" = "" ]; then
        echo "错误：--status-limit 需要一个数字参数。"
        exit 1
      fi
      STATUS_LIMIT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      POSITIONAL+=("$1")
      shift
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
MAX_FILE_BYTES=$((MAX_FILE_MB * 1024 * 1024))
WARN_FILE_BYTES=$((WARN_FILE_MB * 1024 * 1024))

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/yuyingpets-backup.XXXXXX")"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

PENDING_NUL="$TMP_DIR/pending-files.nul"
PENDING_UNIQ_NUL="$TMP_DIR/pending-files-uniq.nul"
SIZE_TSV="$TMP_DIR/pending-sizes.tsv"
OVERSIZED_TSV="$TMP_DIR/oversized.tsv"
WARN_TSV="$TMP_DIR/warn.tsv"
IGNORED_LARGE_TSV="$TMP_DIR/ignored-large.tsv"

collect_pending_files() {
  : >"$PENDING_NUL"
  git diff --cached --name-only -z --diff-filter=ACMRTUXB -- >>"$PENDING_NUL"
  git diff --name-only -z --diff-filter=ACMRTUXB -- >>"$PENDING_NUL"
  git ls-files --others --exclude-standard -z -- >>"$PENDING_NUL"
  python3 - "$PENDING_NUL" "$PENDING_UNIQ_NUL" <<'PY'
import sys
src, dst = sys.argv[1:3]
seen = set()
items = []
with open(src, "rb") as f:
    for raw in f.read().split(b"\0"):
        if not raw or raw in seen:
            continue
        seen.add(raw)
        items.append(raw)
with open(dst, "wb") as f:
    for raw in items:
        f.write(raw + b"\0")
PY
}

scan_pending_file_sizes() {
  : >"$SIZE_TSV"
  : >"$OVERSIZED_TSV"
  : >"$WARN_TSV"
  python3 - "$PENDING_UNIQ_NUL" "$SIZE_TSV" "$OVERSIZED_TSV" "$WARN_TSV" "$MAX_FILE_BYTES" "$WARN_FILE_BYTES" <<'PY'
import os
import sys

pending, sizes, oversized, warn, max_bytes, warn_bytes = sys.argv[1:7]
max_bytes = int(max_bytes)
warn_bytes = int(warn_bytes)

rows = []
with open(pending, "rb") as f:
    for raw in f.read().split(b"\0"):
        if not raw:
            continue
        path = raw.decode("utf-8", "replace")
        if not os.path.isfile(path):
            continue
        size = os.path.getsize(path)
        rows.append((size, path))

rows.sort(reverse=True)
with open(sizes, "w", encoding="utf-8") as all_f, \
     open(oversized, "w", encoding="utf-8") as oversized_f, \
     open(warn, "w", encoding="utf-8") as warn_f:
    for size, path in rows:
        line = f"{size}\t{path}\n"
        all_f.write(line)
        if size > max_bytes:
            oversized_f.write(line)
        elif size >= warn_bytes:
            warn_f.write(line)
PY
}

scan_ignored_large_files() {
  : >"$IGNORED_LARGE_TSV"
  python3 - "$MAX_FILE_BYTES" "$IGNORED_LARGE_TSV" <<'PY'
import os
import subprocess
import sys

max_bytes = int(sys.argv[1])
output = sys.argv[2]
skip_dirs = {".git", "node_modules", "dist", "build", "release", ".venv", ".codex-venv", ".venv-imagegen", ".gemini_scratch"}
rows = []
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in skip_dirs]
    for name in files:
        path = os.path.join(root, name)
        try:
            size = os.path.getsize(path)
        except OSError:
            continue
        if size <= max_bytes:
            continue
        rel = path[2:] if path.startswith("./") else path
        result = subprocess.run(["git", "check-ignore", "-q", "--", rel])
        if result.returncode == 0:
            rows.append((size, rel))
rows.sort(reverse=True)
with open(output, "w", encoding="utf-8") as f:
    for size, path in rows:
        f.write(f"{size}\t{path}\n")
PY
}

print_size_rows() {
  local file="$1"
  local limit="${2:-20}"
  if [ ! -s "$file" ]; then
    return 0
  fi
  python3 - "$file" "$limit" <<'PY'
import sys
path, limit = sys.argv[1], int(sys.argv[2])
with open(path, encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if idx >= limit:
            break
        size_s, file_path = line.rstrip("\n").split("\t", 1)
        size = int(size_s)
        print(f"{size / 1024 / 1024:8.2f} MB  {file_path}")
PY
}

sum_size_rows() {
  local file="$1"
  if [ ! -s "$file" ]; then
    echo "0"
    return 0
  fi
  python3 - "$file" <<'PY'
import sys
total = 0
count = 0
with open(sys.argv[1], encoding="utf-8") as f:
    for line in f:
        size_s, _ = line.rstrip("\n").split("\t", 1)
        total += int(size_s)
        count += 1
print(f"{count} 个文件，约 {total / 1024 / 1024:.2f} MB")
PY
}

collect_pending_files
scan_pending_file_sizes
scan_ignored_large_files

echo "当前目录：$CURRENT_DIR"
echo "仓库根目录：$REPO_ROOT"
echo "当前分支：$CURRENT_BRANCH"
echo "目标远程：$REMOTE_NAME"
echo "远程地址：$REMOTE_URL"
echo "单文件阻断阈值：${MAX_FILE_MB}MB"
echo "单文件警告阈值：${WARN_FILE_MB}MB"
echo
echo "工作区状态："
git status --short --branch --untracked-files=all | sed -n "1,${STATUS_LIMIT}p"

echo
echo "待提交文件体积预检：$(sum_size_rows "$SIZE_TSV")"
if [ -s "$SIZE_TSV" ]; then
  echo "待提交文件体积 Top 20："
  print_size_rows "$SIZE_TSV" 20
fi

if [ -s "$WARN_TSV" ]; then
  echo
  echo "警告：以下待提交文件超过 ${WARN_FILE_MB}MB，GitHub 可能给出大文件警告："
  print_size_rows "$WARN_TSV" 50
fi

if [ -s "$IGNORED_LARGE_TSV" ]; then
  echo
  echo "已忽略的大文件（不会被本脚本提交）："
  print_size_rows "$IGNORED_LARGE_TSV" 20
fi

if [ -s "$OVERSIZED_TSV" ]; then
  echo
  echo "错误：以下待提交文件超过 ${MAX_FILE_MB}MB，可能触发 GitHub 100MB 单文件硬限制："
  print_size_rows "$OVERSIZED_TSV" 100
  echo
  echo "处理建议：压缩、移出仓库、加入 .gitignore，或改用 Git LFS 后再备份。"
  exit 1
fi

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

git diff --cached --name-only -z --diff-filter=ACMRTUXB -- >"$PENDING_NUL"
python3 - "$PENDING_NUL" "$PENDING_UNIQ_NUL" <<'PY'
import sys
src, dst = sys.argv[1:3]
seen = set()
items = []
with open(src, "rb") as f:
    for raw in f.read().split(b"\0"):
        if not raw or raw in seen:
            continue
        seen.add(raw)
        items.append(raw)
with open(dst, "wb") as f:
    for raw in items:
        f.write(raw + b"\0")
PY
scan_pending_file_sizes
if [ -s "$OVERSIZED_TSV" ]; then
  echo
  echo "错误：git add 后发现超过 ${MAX_FILE_MB}MB 的已暂存文件，已停止提交："
  print_size_rows "$OVERSIZED_TSV" 100
  echo "请先处理大文件后重新运行。"
  exit 1
fi

if git diff --cached --quiet; then
  echo "没有新的文件变更，直接推送当前 HEAD。"
else
  echo "即将提交以下变更："
  git diff --cached --name-status | sed -n '1,200p'
  git commit -m "$COMMIT_MESSAGE"
fi

git push --progress "$REMOTE_NAME" "HEAD:$ALLOWED_BRANCH"
echo "备份完成。"
