#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DISPLAY_APP_DIR="$PROJECT_ROOT/display-app"
DESKTOP_DIR="$DISPLAY_APP_DIR/desktop"

DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_HOST="${DEPLOY_HOST:-8.137.161.101}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_BASE_DIR="${DEPLOY_BASE_DIR:-/www/wwwroot/yuyingpets}"
SSH_CONNECT_TIMEOUT="${SSH_CONNECT_TIMEOUT:-10}"
SSH_CONNECTION_ATTEMPTS="${SSH_CONNECTION_ATTEMPTS:-3}"
SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-6}"
REMOTE_EXEC_RETRIES="${REMOTE_EXEC_RETRIES:-3}"
REMOTE_EXEC_RETRY_DELAY="${REMOTE_EXEC_RETRY_DELAY:-3}"
RSYNC_RETRIES="${RSYNC_RETRIES:-3}"
RSYNC_RETRY_DELAY="${RSYNC_RETRY_DELAY:-3}"
RSYNC_PROGRESS="${RSYNC_PROGRESS:-1}"

DISPLAY_DESKTOP_UPDATE_REMOTE_DIR="${DISPLAY_DESKTOP_UPDATE_REMOTE_DIR:-$DEPLOY_BASE_DIR/static-download/display-app/win}"
DISPLAY_DESKTOP_UPDATE_PUBLIC_URL="${DISPLAY_DESKTOP_UPDATE_PUBLIC_URL:-https://www.dlbfyy.cn/download/display-app/win}"
DISPLAY_DESKTOP_DIST_SCRIPT="${DISPLAY_DESKTOP_DIST_SCRIPT:-dist:win:cn}"
DISPLAY_DESKTOP_VERSION_BUMP="${DISPLAY_DESKTOP_VERSION_BUMP:-patch}"
DISPLAY_DESKTOP_VERSION_OVERRIDE="${DISPLAY_DESKTOP_VERSION_OVERRIDE:-}"
SKIP_BUILD="${SKIP_BUILD:-1}"
VERIFY_DEPLOYMENT="${VERIFY_DEPLOYMENT:-1}"
VERIFY_TIMEOUT="${VERIFY_TIMEOUT:-15}"

REMOTE="$DEPLOY_USER@$DEPLOY_HOST"

if [ -z "${SSH_KEY:-}" ] && [ -f "$HOME/.ssh/id_ed25519_tencent" ]; then
  SSH_KEY="$HOME/.ssh/id_ed25519_tencent"
fi

SSH_ARGS=(-p "$DEPLOY_PORT" -o "IdentitiesOnly=yes")
SSH_ARGS+=(-o "ConnectTimeout=$SSH_CONNECT_TIMEOUT")
SSH_ARGS+=(-o "ConnectionAttempts=$SSH_CONNECTION_ATTEMPTS")
SSH_ARGS+=(-o "ServerAliveInterval=$SSH_SERVER_ALIVE_INTERVAL")
SSH_ARGS+=(-o "ServerAliveCountMax=$SSH_SERVER_ALIVE_COUNT_MAX")
if [ -n "${SSH_KEY:-}" ]; then
  SSH_ARGS+=(-i "$SSH_KEY")
fi

RSYNC_SSH="ssh -p $DEPLOY_PORT -o IdentitiesOnly=yes -o ConnectTimeout=$SSH_CONNECT_TIMEOUT -o ConnectionAttempts=$SSH_CONNECTION_ATTEMPTS -o ServerAliveInterval=$SSH_SERVER_ALIVE_INTERVAL -o ServerAliveCountMax=$SSH_SERVER_ALIVE_COUNT_MAX"
if [ -n "${SSH_KEY:-}" ]; then
  RSYNC_SSH="$RSYNC_SSH -i $SSH_KEY"
fi

usage() {
  cat <<EOF
用法：
  ./deploy-display-desktop.sh [current|patch|minor|major|x.y.z]

说明：
  不传参数时，默认等同于 ./deploy-display-desktop.sh current
  默认不打包，只上传已有的 latest.yml / Setup.exe / blockmap 到自动更新目录。
  如果确实要在当前机器上同时打包，可显式传 SKIP_BUILD=0。

示例：
  ./deploy-display-desktop.sh current
  ./deploy-display-desktop.sh 0.1.3
  SKIP_BUILD=0 ./deploy-display-desktop.sh patch

常用配置：
  DEPLOY_USER=root
  DEPLOY_HOST=8.137.161.101
  DEPLOY_PORT=22
  SSH_KEY=~/.ssh/id_ed25519_tencent
  DEPLOY_BASE_DIR=/www/wwwroot/yuyingpets
  DISPLAY_DESKTOP_UPDATE_REMOTE_DIR=$DISPLAY_DESKTOP_UPDATE_REMOTE_DIR
  DISPLAY_DESKTOP_UPDATE_PUBLIC_URL=$DISPLAY_DESKTOP_UPDATE_PUBLIC_URL
  DISPLAY_DESKTOP_DIST_SCRIPT=$DISPLAY_DESKTOP_DIST_SCRIPT
  DISPLAY_DESKTOP_VERSION_BUMP=patch
  DISPLAY_DESKTOP_VERSION_OVERRIDE=0.1.3
  SKIP_BUILD=1
  VERIFY_DEPLOYMENT=0
  RSYNC_PROGRESS=1
EOF
}

log() {
  printf '\n==> %s\n' "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "错误：未检测到命令 $1，请先安装。"
    exit 1
  fi
}

remote_exec() {
  local remote_cmd="$1"
  local attempt=1
  local output_file=""
  output_file="$(mktemp)"

  while true; do
    if ssh "${SSH_ARGS[@]}" "$REMOTE" "$remote_cmd" >"$output_file" 2>&1; then
      cat "$output_file"
      rm -f "$output_file"
      return 0
    fi

    if [ "$attempt" -ge "$REMOTE_EXEC_RETRIES" ]; then
      cat "$output_file" >&2
      rm -f "$output_file"
      return 1
    fi

    cat "$output_file" >&2
    echo "提示：远端连接异常，${REMOTE_EXEC_RETRY_DELAY}s 后重试 (${attempt}/${REMOTE_EXEC_RETRIES})" >&2
    attempt=$((attempt + 1))
    sleep "$REMOTE_EXEC_RETRY_DELAY"
  done
}

rsync_with_retry() {
  local attempt=1

  while true; do
    if rsync "$@"; then
      return 0
    fi

    if [ "$attempt" -ge "$RSYNC_RETRIES" ]; then
      return 1
    fi

    echo "提示：rsync 传输失败，${RSYNC_RETRY_DELAY}s 后重试 (${attempt}/${RSYNC_RETRIES})" >&2
    attempt=$((attempt + 1))
    sleep "$RSYNC_RETRY_DELAY"
  done
}

rsync_supports_option() {
  local option="$1"
  rsync --help 2>/dev/null | grep -F -- "$option" >/dev/null 2>&1
}

ensure_remote_dir() {
  remote_exec "mkdir -p '$1'"
}

fix_remote_desktop_release_permissions() {
  local remote_dir="$1"
  remote_exec "find '$remote_dir' -maxdepth 1 -type d -exec chmod 755 {} \; && find '$remote_dir' -maxdepth 1 -type f -exec chmod 644 {} \;"
}

verify_url() {
  local url="$1"
  local label="$2"
  local status=""

  if [ "$VERIFY_DEPLOYMENT" != "1" ]; then
    return 0
  fi

  log "校验 $label: $url"
  if curl -kfsSIL --connect-timeout 5 --max-time "$VERIFY_TIMEOUT" "$url" >/dev/null 2>&1; then
    return 0
  fi

  status="$(curl -ksS -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time "$VERIFY_TIMEOUT" -r 0-0 "$url" || true)"
  case "$status" in
    200|206)
      return 0
      ;;
    403|405)
      echo "提示: 服务器拒绝 HEAD/Range 校验 (HTTP $status), 跳过公开地址校验: $url" >&2
      return 0
      ;;
  esac

  echo "错误: 公开地址校验失败 (HTTP ${status:-unknown}): $url" >&2
  return 1
}

resolve_bump_mode() {
  local arg="${1:-}"
  if [ -n "$DISPLAY_DESKTOP_VERSION_OVERRIDE" ]; then
    printf '%s' "$DISPLAY_DESKTOP_VERSION_OVERRIDE"
    return 0
  fi
  if [ -n "$arg" ]; then
    printf '%s' "$arg"
    return 0
  fi
  printf '%s' "current"
}

current_desktop_version() {
  node -p "require('$DESKTOP_DIR/package.json').version"
}

current_release_version() {
  local latest_yml="$DESKTOP_DIR/release/latest.yml"
  if [ ! -f "$latest_yml" ]; then
    return 1
  fi
  node -e "const fs=require('fs'); const text=fs.readFileSync(process.argv[1],'utf8'); const m=text.match(/^version:\\s*(.+)$/m); if(!m){process.exit(1)} process.stdout.write(String(m[1]).trim())" "$latest_yml"
}

bump_desktop_version() {
  local requested="$1"
  local old_version=""
  local new_version=""
  old_version="$(current_desktop_version)"

  if [ "$requested" = "current" ]; then
    if [ "$SKIP_BUILD" = "1" ]; then
      if new_version="$(current_release_version 2>/dev/null)"; then
        printf '%s' "$new_version"
        return 0
      fi
    fi
    printf '%s' "$old_version"
    return 0
  fi

  if [[ "$requested" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log "设置 desktop 版本号: $old_version -> $requested"
    (
      cd "$DISPLAY_APP_DIR"
      npm version "$requested" --workspace desktop --no-git-tag-version --allow-same-version >/dev/null
    )
  else
    log "递增 desktop 版本号 ($requested): $old_version"
    (
      cd "$DISPLAY_APP_DIR"
      npm version "$requested" --workspace desktop --no-git-tag-version >/dev/null
    )
  fi

  new_version="$(current_desktop_version)"
  printf '%s' "$new_version"
}

build_desktop_installer() {
  if [ "$SKIP_BUILD" = "1" ]; then
    return 0
  fi

  log "执行 Windows 安装包构建脚本: npm run $DISPLAY_DESKTOP_DIST_SCRIPT --workspace desktop"
  (
    cd "$DISPLAY_APP_DIR"
    npm run "$DISPLAY_DESKTOP_DIST_SCRIPT" --workspace desktop
  )
}

resolve_release_files() {
  local version="$1"
  local release_dir="$DESKTOP_DIR/release"
  local installer="$release_dir/YuYingPets-Display-${version}-Setup.exe"
  local blockmap="${installer}.blockmap"
  local latest="$release_dir/latest.yml"

  if [ ! -f "$installer" ]; then
    echo "错误：未找到安装包 $installer" >&2
    exit 1
  fi
  if [ ! -f "$blockmap" ]; then
    echo "错误：未找到 blockmap 文件 $blockmap" >&2
    exit 1
  fi
  if [ ! -f "$latest" ]; then
    echo "错误：未找到更新元数据 $latest" >&2
    exit 1
  fi

  printf '%s\n%s\n%s\n' "$latest" "$installer" "$blockmap"
}

upload_desktop_release() {
  local version="$1"
  local latest_file="$2"
  local installer_file="$3"
  local blockmap_file="$4"
  local -a rsync_args=()

  log "上传桌面端自动更新文件到 $REMOTE:$DISPLAY_DESKTOP_UPDATE_REMOTE_DIR"
  ensure_remote_dir "$DISPLAY_DESKTOP_UPDATE_REMOTE_DIR"
  rsync_args=(-az --partial --human-readable --stats -e "$RSYNC_SSH")
  if [ "$RSYNC_PROGRESS" = "1" ]; then
    if rsync_supports_option "--info"; then
      rsync_args+=(--info=progress2)
    else
      rsync_args+=(--progress)
    fi
  fi
  rsync_with_retry "${rsync_args[@]}" \
    "$latest_file" \
    "$installer_file" \
    "$blockmap_file" \
    "$REMOTE:$DISPLAY_DESKTOP_UPDATE_REMOTE_DIR/"
  fix_remote_desktop_release_permissions "$DISPLAY_DESKTOP_UPDATE_REMOTE_DIR"

  verify_url "$DISPLAY_DESKTOP_UPDATE_PUBLIC_URL/latest.yml" "desktop latest.yml"
  verify_url "$DISPLAY_DESKTOP_UPDATE_PUBLIC_URL/$(basename "$installer_file")" "desktop 安装包"

  log "桌面端 $version 发布完成"
  echo "版本号: $version"
  echo "更新目录: $DISPLAY_DESKTOP_UPDATE_REMOTE_DIR"
  echo "访问地址: $DISPLAY_DESKTOP_UPDATE_PUBLIC_URL/"
}

main() {
  local arg="${1:-}"
  local requested_bump=""
  local version=""
  local latest_file=""
  local installer_file=""
  local blockmap_file=""
  local release_lines=""

  if [ "${arg:-}" = "-h" ] || [ "${arg:-}" = "--help" ]; then
    usage
    exit 0
  fi

  require_command npm
  require_command node
  require_command rsync
  require_command ssh
  require_command curl

  requested_bump="$(resolve_bump_mode "$arg")"
  version="$(bump_desktop_version "$requested_bump")"

  build_desktop_installer

  release_lines="$(resolve_release_files "$version")"
  latest_file="$(printf '%s\n' "$release_lines" | sed -n '1p')"
  installer_file="$(printf '%s\n' "$release_lines" | sed -n '2p')"
  blockmap_file="$(printf '%s\n' "$release_lines" | sed -n '3p')"

  upload_desktop_release "$version" "$latest_file" "$installer_file" "$blockmap_file"
}

main "${1:-}"
