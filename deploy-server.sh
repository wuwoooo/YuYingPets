#!/usr/bin/env bash

set -euo pipefail

# 用法：
#   ./deploy-server.sh admin-web
#   ./deploy-server.sh display-app backend
#   ./deploy-server.sh all
#
# 可覆盖配置：
#   DEPLOY_USER=root DEPLOY_HOST=8.137.161.101 DEPLOY_PORT=22 ./deploy-server.sh all
#   SSH_KEY="$HOME/.ssh/id_ed25519" ./deploy-server.sh backend
#   DEPLOY_BASE_DIR=/var/www/yuyingpets ./deploy-server.sh all
#   BACKEND_RESTART_CMD="pm2 restart yuyingpets-backend" ./deploy-server.sh backend

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_HOST="${DEPLOY_HOST:-8.137.161.101}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_BASE_DIR="${DEPLOY_BASE_DIR:-/var/www/yuyingpets}"

ADMIN_REMOTE_DIR="${ADMIN_REMOTE_DIR:-$DEPLOY_BASE_DIR/admin-web}"
DISPLAY_REMOTE_DIR="${DISPLAY_REMOTE_DIR:-$DEPLOY_BASE_DIR/display-app}"
BACKEND_REMOTE_DIR="${BACKEND_REMOTE_DIR:-$DEPLOY_BASE_DIR/backend}"

SKIP_BUILD="${SKIP_BUILD:-0}"
REMOTE_NPM_INSTALL="${REMOTE_NPM_INSTALL:-1}"
RUN_PRISMA_GENERATE="${RUN_PRISMA_GENERATE:-1}"
BACKEND_RESTART_CMD="${BACKEND_RESTART_CMD:-}"

REMOTE="$DEPLOY_USER@$DEPLOY_HOST"

SSH_ARGS=(-p "$DEPLOY_PORT")
if [ -n "${SSH_KEY:-}" ]; then
  SSH_ARGS+=(-i "$SSH_KEY")
fi

RSYNC_SSH="ssh -p $DEPLOY_PORT"
if [ -n "${SSH_KEY:-}" ]; then
  RSYNC_SSH="$RSYNC_SSH -i $SSH_KEY"
fi

usage() {
  cat <<EOF
用法：
  ./deploy-server.sh <admin-web|display-app|backend|all> [...]

示例：
  ./deploy-server.sh admin-web
  ./deploy-server.sh display-app backend
  ./deploy-server.sh all

常用配置：
  DEPLOY_USER=root              SSH 用户，默认 root
  DEPLOY_HOST=8.137.161.101     服务器地址
  DEPLOY_PORT=22                SSH 端口
  SSH_KEY=~/.ssh/id_ed25519     SSH 私钥
  DEPLOY_BASE_DIR=/var/www/yuyingpets
  ADMIN_REMOTE_DIR=...          管理后台远端目录
  DISPLAY_REMOTE_DIR=...        Display 远端目录
  BACKEND_REMOTE_DIR=...        后端远端目录
  BACKEND_RESTART_CMD="pm2 restart yuyingpets-backend"
  SKIP_BUILD=1                  跳过本地构建
  REMOTE_NPM_INSTALL=0          后端上传后不执行 npm ci --omit=dev
  RUN_PRISMA_GENERATE=0         后端上传后不执行 npx prisma generate
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
    "$PROJECT_ROOT/admin-web/dist/" \
    "$REMOTE:$ADMIN_REMOTE_DIR/"
}

deploy_display_app() {
  build_display_app

  log "上传 display-app/web 到 $REMOTE:$DISPLAY_REMOTE_DIR"
  ensure_remote_dir "$DISPLAY_REMOTE_DIR"
  rsync -az --delete -e "$RSYNC_SSH" \
    "$PROJECT_ROOT/display-app/web/dist/" \
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
    --exclude 'public/uploads/' \
    "$PROJECT_ROOT/backend/package.json" \
    "$PROJECT_ROOT/backend/package-lock.json" \
    "$PROJECT_ROOT/backend/dist" \
    "$PROJECT_ROOT/backend/prisma" \
    "$PROJECT_ROOT/backend/sql" \
    "$PROJECT_ROOT/backend/scripts" \
    "$PROJECT_ROOT/backend/public" \
    "$REMOTE:$BACKEND_REMOTE_DIR/"

  if [ "$REMOTE_NPM_INSTALL" = "1" ]; then
    log "服务器端安装 backend 生产依赖"
    remote_exec "cd '$BACKEND_REMOTE_DIR' && npm ci --omit=dev"
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
  for target in "${targets[@]}"; do
    case "$target" in
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
  done

  log "部署完成"
}

main "$@"
