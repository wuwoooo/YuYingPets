#!/usr/bin/env bash

set -euo pipefail

# 用法：
#   ./deploy.sh admin-web
#   ./deploy.sh display-app backend
#   ./deploy.sh all
#
# 可覆盖配置：
#   DEPLOY_USER=root DEPLOY_HOST=8.137.161.101 DEPLOY_PORT=22 ./deploy.sh all
#   SSH_KEY="$HOME/.ssh/id_ed25519_tencent" ./deploy.sh backend
#   DEPLOY_BASE_DIR=/www/wwwroot/yuyingpets ./deploy.sh all
#   BACKEND_RESTART_CMD="pm2 startOrReload ecosystem.config.cjs --env production && pm2 save" ./deploy.sh backend

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

ADMIN_REMOTE_DIR="${ADMIN_REMOTE_DIR:-$DEPLOY_BASE_DIR/www-admin}"
DISPLAY_REMOTE_DIR="${DISPLAY_REMOTE_DIR:-$DEPLOY_BASE_DIR/www-admin/display}"
BACKEND_REMOTE_DIR="${BACKEND_REMOTE_DIR:-$DEPLOY_BASE_DIR/backend}"

SKIP_BUILD="${SKIP_BUILD:-0}"
REMOTE_NPM_INSTALL="${REMOTE_NPM_INSTALL:-1}"
RUN_PRISMA_GENERATE="${RUN_PRISMA_GENERATE:-1}"
BACKEND_RESTART_CMD="${BACKEND_RESTART_CMD:-pm2 startOrReload ecosystem.config.cjs --env production && pm2 save}"
REMOTE_NPM_REGISTRY="${REMOTE_NPM_REGISTRY:-}"
NPM_INSTALL_FLAGS="${NPM_INSTALL_FLAGS:---no-audit --no-fund}"
NPM_LOG_LEVEL="${NPM_LOG_LEVEL:-error}"
BACKEND_HEALTHCHECK_PATH="${BACKEND_HEALTHCHECK_PATH:-/api/v1/display/unlock-status}"
BACKEND_HEALTHCHECK_PORT="${BACKEND_HEALTHCHECK_PORT:-3000}"
BACKEND_HEALTHCHECK_HOST="${BACKEND_HEALTHCHECK_HOST:-127.0.0.1}"
BACKEND_HEALTHCHECK_RETRIES="${BACKEND_HEALTHCHECK_RETRIES:-40}"
BACKEND_HEALTHCHECK_INTERVAL="${BACKEND_HEALTHCHECK_INTERVAL:-3}"
BACKEND_HEALTHCHECK_INITIAL_DELAY="${BACKEND_HEALTHCHECK_INITIAL_DELAY:-5}"
BACKEND_KEEP_STAGING="${BACKEND_KEEP_STAGING:-0}"
CONTINUE_ON_ERROR="${CONTINUE_ON_ERROR:-0}"

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
  ./deploy.sh <admin-web|display-app|backend|all> [...]

示例：
  ./deploy.sh admin-web
  ./deploy.sh display-app backend
  ./deploy.sh all

常用配置：
  DEPLOY_USER=root              SSH 用户，默认 root
  DEPLOY_HOST=8.137.161.101     服务器地址
  DEPLOY_PORT=22                SSH 端口
  SSH_KEY=~/.ssh/id_ed25519_tencent
  SSH_CONNECT_TIMEOUT=10        SSH 连接超时秒数
  SSH_CONNECTION_ATTEMPTS=3     SSH 建连重试次数
  SSH_SERVER_ALIVE_INTERVAL=15  SSH 保活间隔秒数
  SSH_SERVER_ALIVE_COUNT_MAX=6  SSH 保活失败次数上限
  REMOTE_EXEC_RETRIES=3         远端命令失败后的重试次数
  REMOTE_EXEC_RETRY_DELAY=3     远端命令重试间隔秒数
  RSYNC_RETRIES=3               rsync 失败后的重试次数
  RSYNC_RETRY_DELAY=3           rsync 重试间隔秒数
  DEPLOY_BASE_DIR=/www/wwwroot/yuyingpets
  ADMIN_REMOTE_DIR=...          管理后台远端目录
  DISPLAY_REMOTE_DIR=...        Display 远端目录
  BACKEND_REMOTE_DIR=...        后端远端目录
  BACKEND_RESTART_CMD="pm2 startOrReload ecosystem.config.cjs --env production && pm2 save"
  SKIP_BUILD=1                  跳过本地构建
  REMOTE_NPM_INSTALL=0          后端上传后不执行 npm install
  RUN_PRISMA_GENERATE=0         后端上传后不执行 npx prisma generate
  REMOTE_NPM_REGISTRY=...       服务器端 npm registry，例如 https://registry.npmmirror.com
  NPM_INSTALL_FLAGS="..."       安装依赖附加参数，默认 --no-audit --no-fund
  NPM_LOG_LEVEL=error           npm 日志级别，默认仅输出错误
  BACKEND_HEALTHCHECK_PATH=...  后端重启后的探活路径，默认 /api/v1/display/unlock-status
  BACKEND_HEALTHCHECK_PORT=3000 后端探活端口
  BACKEND_HEALTHCHECK_HOST=127.0.0.1
  BACKEND_HEALTHCHECK_RETRIES=40
  BACKEND_HEALTHCHECK_INTERVAL=3
  BACKEND_HEALTHCHECK_INITIAL_DELAY=5
  BACKEND_KEEP_STAGING=1        保留服务器端 staging 目录，便于排查
  BACKEND_RESTART_CMD="..."     后端重启命令，默认按 ecosystem.config.cjs 启动/重载并保存 PM2
  CONTINUE_ON_ERROR=1           某个模块失败后继续尝试后续模块

静态资源说明：
  deploy.sh 不会上传 public/assets/。pets 与 pet-decorations 需单独 rsync/tar 到服务器。
  Nginx 需为 /assets/pets/ 与 /assets/pet-decorations/ 配置 alias 及 30 天 immutable 缓存，
  见 deploy/nginx/yuyingpets-static-assets.snippet.conf
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

    if ! grep -Eqi 'Connection closed by|Network is down|Broken pipe|kex_exchange_identification|banner exchange|Connection reset by peer|Operation timed out|Connection timed out' "$output_file"; then
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

ensure_remote_dir() {
  remote_exec "mkdir -p '$1'"
}

shell_escape() {
  printf "%q" "$1"
}

npm_install_if_needed() {
  local dir="$1"

  if [ -d "$dir/node_modules" ]; then
    return
  fi

  log "$dir 未检测到 node_modules，正在安装依赖"
  (
    cd "$dir"
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
  )
}

build_admin_web() {
  if [ "$SKIP_BUILD" = "1" ]; then
    return
  fi

  log "构建 admin-web"
  npm_install_if_needed "$PROJECT_ROOT/admin-web"
  (cd "$PROJECT_ROOT/admin-web" && npm run build)
}

build_display_app() {
  if [ "$SKIP_BUILD" = "1" ]; then
    return
  fi

  log "构建 display-app/web"
  npm_install_if_needed "$PROJECT_ROOT/display-app"
  (cd "$PROJECT_ROOT/display-app" && npm run build:web)
}

build_backend() {
  if [ "$SKIP_BUILD" = "1" ]; then
    return
  fi

  log "构建 backend"
  npm_install_if_needed "$PROJECT_ROOT/backend"
  (cd "$PROJECT_ROOT/backend" && npm run build)
}

deploy_admin_web() {
  build_admin_web

  log "上传 admin-web 到 $REMOTE:$ADMIN_REMOTE_DIR"
  ensure_remote_dir "$ADMIN_REMOTE_DIR"
  rsync_with_retry -az --delete -e "$RSYNC_SSH" \
    --exclude 'display/' \
    "$PROJECT_ROOT/admin-web/dist/" \
    "$REMOTE:$ADMIN_REMOTE_DIR/"
}

deploy_display_app() {
  build_display_app

  local display_stage="$PROJECT_ROOT/.deploy/display-app"
  local display_asset_version="${DISPLAY_ASSET_VERSION:-$(date +%Y%m%d%H%M%S)}"
  rm -rf "$display_stage"
  mkdir -p "$display_stage"

  rsync_with_retry -a \
    --exclude 'display/' \
    "$PROJECT_ROOT/display-app/web/dist/" \
    "$display_stage/"

  rsync_with_retry -a \
    --exclude 'index.html' \
    --exclude '.DS_Store' \
    --exclude 'images/display-bg.svg' \
    "$PROJECT_ROOT/display-app/web/dist/display/" \
    "$display_stage/"

  if [ -f "$display_stage/display.html" ]; then
    log "更新 display-app 静态资源版本号 v=$display_asset_version"
    DISPLAY_ASSET_VERSION="$display_asset_version" node - "$display_stage/display.html" <<'NODE'
const fs = require('node:fs');
const htmlPath = process.argv[2];
const version = process.env.DISPLAY_ASSET_VERSION;
const targets = [
  './styles/display.css',
  './scripts/pet-colors.js',
  './scripts/display-app.js',
];
let html = fs.readFileSync(htmlPath, 'utf8');
for (const target of targets) {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(`${escaped}(?:\\?v=[^"'<>\\s]*)?`, 'g'), `${target}?v=${version}`);
}
fs.writeFileSync(htmlPath, html);
NODE
  fi

  log "上传 display-app/web 到 $REMOTE:$DISPLAY_REMOTE_DIR"
  ensure_remote_dir "$DISPLAY_REMOTE_DIR"
  rsync_with_retry -az --delete --delete-excluded -e "$RSYNC_SSH" \
    --exclude '.DS_Store' \
    "$display_stage/" \
    "$REMOTE:$DISPLAY_REMOTE_DIR/"
}

deploy_backend() {
  build_backend

  local backend_stage_dir="${BACKEND_REMOTE_DIR}.staging"
  local remote_npm_registry_cmd=""
  local remote_npm_install_cmd=""
  local remote_prisma_cmd=""
  local remote_healthcheck_url="http://${BACKEND_HEALTHCHECK_HOST}:${BACKEND_HEALTHCHECK_PORT}${BACKEND_HEALTHCHECK_PATH}"
  local remote_port_check_cmd=""
  local remote_cleanup_cmd=""

  if [ -n "$REMOTE_NPM_REGISTRY" ]; then
    remote_npm_registry_cmd="npm config set registry $(shell_escape "$REMOTE_NPM_REGISTRY") && "
  fi

  remote_npm_install_cmd="cd $(shell_escape "$backend_stage_dir") && ${remote_npm_registry_cmd}if [ -f package-lock.json ]; then npm ci --loglevel=$(shell_escape "$NPM_LOG_LEVEL") ${NPM_INSTALL_FLAGS}; else npm install --loglevel=$(shell_escape "$NPM_LOG_LEVEL") ${NPM_INSTALL_FLAGS}; fi"
  remote_prisma_cmd="cd $(shell_escape "$backend_stage_dir") && npm_config_loglevel=$(shell_escape "$NPM_LOG_LEVEL") npx prisma generate"
  remote_port_check_cmd="if command -v ss >/dev/null 2>&1; then ss -ltn | grep -q ':${BACKEND_HEALTHCHECK_PORT} '; else netstat -ltn 2>/dev/null | grep -q ':${BACKEND_HEALTHCHECK_PORT} '; fi"
  remote_cleanup_cmd="rm -rf $(shell_escape "$backend_stage_dir")"

  log "上传 backend 到服务器 staging 目录 $REMOTE:$backend_stage_dir"
  remote_exec "rm -rf $(shell_escape "$backend_stage_dir") && mkdir -p $(shell_escape "$backend_stage_dir")"
  rsync_with_retry -az --delete -e "$RSYNC_SSH" \
    --exclude '.env' \
    --exclude '.cache/' \
    --exclude 'node_modules/' \
    --exclude 'tmp/' \
    --exclude 'public/assets/' \
    --exclude 'public/uploads/' \
    "$PROJECT_ROOT/backend/package.json" \
    "$PROJECT_ROOT/backend/package-lock.json" \
    "$PROJECT_ROOT/backend/ecosystem.config.cjs" \
    "$PROJECT_ROOT/backend/dist" \
    "$PROJECT_ROOT/backend/prisma" \
    "$PROJECT_ROOT/backend/sql" \
    "$PROJECT_ROOT/backend/scripts" \
    "$PROJECT_ROOT/backend/public" \
    "$REMOTE:$backend_stage_dir/"

  remote_exec "mkdir -p $(shell_escape "$backend_stage_dir/logs")"

  if [ "$REMOTE_NPM_INSTALL" = "1" ]; then
    log "服务器端在 staging 目录安装 backend 依赖"
    remote_exec "$remote_npm_install_cmd"
  fi

  if [ "$RUN_PRISMA_GENERATE" = "1" ]; then
    log "服务器端在 staging 目录生成 Prisma Client"
    remote_exec "$remote_prisma_cmd"
  fi

  log "将 staging 内容切换到正式 backend 目录"
  ensure_remote_dir "$BACKEND_REMOTE_DIR"
  remote_exec "mkdir -p $(shell_escape "$BACKEND_REMOTE_DIR/logs")"
  remote_exec "rsync -a --delete \
    --exclude .env \
    --exclude .cache/ \
    --exclude tmp/ \
    --exclude logs/ \
    --exclude public/assets/ \
    --exclude public/uploads/ \
    $(shell_escape "$backend_stage_dir")/ \
    $(shell_escape "$BACKEND_REMOTE_DIR")/"

  if [ -n "$BACKEND_RESTART_CMD" ]; then
    log "重启 backend"
    remote_exec "cd '$BACKEND_REMOTE_DIR' && $BACKEND_RESTART_CMD"
  else
    log "未设置 BACKEND_RESTART_CMD，已跳过后端重启"
  fi

  log "检查 backend 健康状态 $remote_healthcheck_url"
  remote_exec "sleep $(shell_escape "$BACKEND_HEALTHCHECK_INITIAL_DELAY")
  attempt=1; until curl -fsS --connect-timeout 2 --max-time 5 $(shell_escape "$remote_healthcheck_url") >/dev/null; do
    if [ \$attempt -ge $(shell_escape "$BACKEND_HEALTHCHECK_RETRIES") ]; then
      if $(printf "%s" "$remote_port_check_cmd"); then
        echo '提示：backend 健康检查接口未通过，但服务端口已监听，按成功处理'
        exit 0
      fi
      echo '错误：backend 健康检查失败'
      pm2 status || true
      $(printf "%s" "$remote_port_check_cmd") || true
      tail -n 80 $(shell_escape "$BACKEND_REMOTE_DIR/logs/error.log") 2>/dev/null || true
      exit 1
    fi
    sleep $(shell_escape "$BACKEND_HEALTHCHECK_INTERVAL")
    attempt=\$((attempt + 1))
  done
  echo '提示：backend 健康检查通过'"

  if [ "$BACKEND_KEEP_STAGING" != "1" ]; then
    remote_exec "$remote_cleanup_cmd"
  fi
}

normalize_target() {
  case "$1" in
    admin|admin-web)
      echo "admin-web"
      ;;
    display|display-app)
      echo "display-app"
      ;;
    api|server|backend)
      echo "backend"
      ;;
    all)
      echo "all"
      ;;
    -h|--help|help)
      echo "help"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

main() {
  if [ "$#" -eq 0 ]; then
    usage
    exit 1
  fi

  require_command ssh
  require_command rsync
  require_command npm

  local targets=()
  local arg normalized
  for arg in "$@"; do
    normalized="$(normalize_target "$arg")"
    case "$normalized" in
      admin-web|display-app|backend)
        targets+=("$normalized")
        ;;
      all)
        targets=(admin-web display-app backend)
        ;;
      help)
        usage
        exit 0
        ;;
      unknown)
        echo "错误：未知参数 $arg"
        usage
        exit 1
        ;;
    esac
  done

  log "目标服务器 $REMOTE:$DEPLOY_PORT"
  log "部署模块 ${targets[*]}"

  local failed_targets=()
  for target in "${targets[@]}"; do
    if ! case "$target" in
      admin-web)
        deploy_admin_web
        ;;
      display-app)
        deploy_display_app
        ;;
      backend)
        deploy_backend
        ;;
    esac
    then
      echo "错误：$target 部署失败。"
      failed_targets+=("$target")
      if [ "$CONTINUE_ON_ERROR" != "1" ]; then
        echo "已停止后续模块部署。如需失败后继续尝试，执行：CONTINUE_ON_ERROR=1 ./deploy.sh ${targets[*]}"
        exit 1
      fi
    fi
  done

  if [ "${#failed_targets[@]}" -gt 0 ]; then
    echo "错误：以下模块部署失败：${failed_targets[*]}"
    exit 1
  fi

  log "部署完成"
}

main "$@"
