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

ADMIN_REMOTE_DIR="${ADMIN_REMOTE_DIR:-$DEPLOY_BASE_DIR/www-admin}"
DISPLAY_REMOTE_DIR="${DISPLAY_REMOTE_DIR:-$DEPLOY_BASE_DIR/www-admin/display}"
BACKEND_REMOTE_DIR="${BACKEND_REMOTE_DIR:-$DEPLOY_BASE_DIR/backend}"

SKIP_BUILD="${SKIP_BUILD:-0}"
REMOTE_NPM_INSTALL="${REMOTE_NPM_INSTALL:-1}"
RUN_PRISMA_GENERATE="${RUN_PRISMA_GENERATE:-1}"
BACKEND_RESTART_CMD="${BACKEND_RESTART_CMD:-pm2 startOrReload ecosystem.config.cjs --env production && pm2 save}"
CONTINUE_ON_ERROR="${CONTINUE_ON_ERROR:-0}"

REMOTE="$DEPLOY_USER@$DEPLOY_HOST"

if [ -z "${SSH_KEY:-}" ] && [ -f "$HOME/.ssh/id_ed25519_tencent" ]; then
  SSH_KEY="$HOME/.ssh/id_ed25519_tencent"
fi

SSH_ARGS=(-p "$DEPLOY_PORT" -o "IdentitiesOnly=yes")
if [ -n "${SSH_KEY:-}" ]; then
  SSH_ARGS+=(-i "$SSH_KEY")
fi

RSYNC_SSH="ssh -p $DEPLOY_PORT -o IdentitiesOnly=yes"
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
  DEPLOY_BASE_DIR=/www/wwwroot/yuyingpets
  ADMIN_REMOTE_DIR=...          管理后台远端目录
  DISPLAY_REMOTE_DIR=...        Display 远端目录
  BACKEND_REMOTE_DIR=...        后端远端目录
  BACKEND_RESTART_CMD="pm2 startOrReload ecosystem.config.cjs --env production && pm2 save"
  SKIP_BUILD=1                  跳过本地构建
  REMOTE_NPM_INSTALL=0          后端上传后不执行 npm install
  RUN_PRISMA_GENERATE=0         后端上传后不执行 npx prisma generate
  BACKEND_RESTART_CMD="..."     后端重启命令，默认按 ecosystem.config.cjs 启动/重载并保存 PM2
  CONTINUE_ON_ERROR=1           某个模块失败后继续尝试后续模块
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
  ssh "${SSH_ARGS[@]}" "$REMOTE" "$1"
}

ensure_remote_dir() {
  remote_exec "mkdir -p '$1'"
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
  rsync -az --delete -e "$RSYNC_SSH" \
    --exclude 'display/' \
    "$PROJECT_ROOT/admin-web/dist/" \
    "$REMOTE:$ADMIN_REMOTE_DIR/"
}

deploy_display_app() {
  build_display_app

  local display_stage="$PROJECT_ROOT/.deploy/display-app"
  rm -rf "$display_stage"
  mkdir -p "$display_stage"

  rsync -a \
    --exclude 'display/' \
    "$PROJECT_ROOT/display-app/web/dist/" \
    "$display_stage/"

  rsync -a \
    --exclude 'index.html' \
    --exclude '.DS_Store' \
    --exclude 'images/display-bg.svg' \
    "$PROJECT_ROOT/display-app/web/dist/display/" \
    "$display_stage/"

  log "上传 display-app/web 到 $REMOTE:$DISPLAY_REMOTE_DIR"
  ensure_remote_dir "$DISPLAY_REMOTE_DIR"
  rsync -az --delete --delete-excluded -e "$RSYNC_SSH" \
    --exclude '.DS_Store' \
    "$display_stage/" \
    "$REMOTE:$DISPLAY_REMOTE_DIR/"
}

deploy_backend() {
  build_backend

  log "上传 backend 到 $REMOTE:$BACKEND_REMOTE_DIR"
  ensure_remote_dir "$BACKEND_REMOTE_DIR"
  rsync -az --delete -e "$RSYNC_SSH" \
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
    "$REMOTE:$BACKEND_REMOTE_DIR/"

  remote_exec "mkdir -p '$BACKEND_REMOTE_DIR/logs'"

  if [ "$REMOTE_NPM_INSTALL" = "1" ]; then
    log "服务器端安装 backend 依赖"
    remote_exec "cd '$BACKEND_REMOTE_DIR' && if [ -f package-lock.json ]; then npm ci; else npm install; fi"
  fi

  if [ "$RUN_PRISMA_GENERATE" = "1" ]; then
    log "服务器端生成 Prisma Client"
    remote_exec "cd '$BACKEND_REMOTE_DIR' && npx prisma generate"
  fi

  if [ -n "$BACKEND_RESTART_CMD" ]; then
    log "重启 backend"
    remote_exec "cd '$BACKEND_REMOTE_DIR' && $BACKEND_RESTART_CMD"
  else
    log "未设置 BACKEND_RESTART_CMD，已跳过后端重启"
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
