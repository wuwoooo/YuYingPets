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
BACKEND_RELEASES_DIR="${BACKEND_RELEASES_DIR:-$DEPLOY_BASE_DIR/releases/backend}"
BACKEND_SHARED_DIR="${BACKEND_SHARED_DIR:-$DEPLOY_BASE_DIR/shared/backend}"
BACKEND_MIGRATE_REMOTE_DIR="${BACKEND_MIGRATE_REMOTE_DIR:-$DEPLOY_BASE_DIR/shared/backend-migrate}"
BACKEND_PM2_APP_NAME="${BACKEND_PM2_APP_NAME:-yuyingpets-backend}"

SKIP_BUILD="${SKIP_BUILD:-0}"
REMOTE_NPM_INSTALL="${REMOTE_NPM_INSTALL:-1}"
RUN_PRISMA_GENERATE="${RUN_PRISMA_GENERATE:-1}"
REMOTE_NPM_REGISTRY="${REMOTE_NPM_REGISTRY:-}"
NPM_INSTALL_FLAGS="${NPM_INSTALL_FLAGS:---no-audit --no-fund}"
NPM_LOG_LEVEL="${NPM_LOG_LEVEL:-error}"
BACKEND_RESTART_CMD="${BACKEND_RESTART_CMD:-pm2 startOrReload ecosystem.config.cjs --env production && pm2 save}"
BACKEND_HEALTHCHECK_PATH="${BACKEND_HEALTHCHECK_PATH:-/api/v1/health}"
BACKEND_HEALTHCHECK_PORT="${BACKEND_HEALTHCHECK_PORT:-3000}"
BACKEND_HEALTHCHECK_HOST="${BACKEND_HEALTHCHECK_HOST:-127.0.0.1}"
BACKEND_HEALTHCHECK_RETRIES="${BACKEND_HEALTHCHECK_RETRIES:-40}"
BACKEND_HEALTHCHECK_INTERVAL="${BACKEND_HEALTHCHECK_INTERVAL:-3}"
BACKEND_HEALTHCHECK_INITIAL_DELAY="${BACKEND_HEALTHCHECK_INITIAL_DELAY:-5}"
BACKEND_RELEASE_KEEP="${BACKEND_RELEASE_KEEP:-5}"
BACKEND_KEEP_FAILED_RELEASE="${BACKEND_KEEP_FAILED_RELEASE:-1}"
BACKEND_ASSETS_DELETE="${BACKEND_ASSETS_DELETE:-0}"
BACKEND_ASSETS_REMOTE_DIR="${BACKEND_ASSETS_REMOTE_DIR:-$BACKEND_SHARED_DIR/public/assets}"
BACKEND_SQL_HISTORY_TABLE="${BACKEND_SQL_HISTORY_TABLE:-deploy_sql_history}"
BACKEND_SQL_BOOTSTRAP_MODE="${BACKEND_SQL_BOOTSTRAP_MODE:-baseline-existing}"
ADMIN_VERIFY_URL="${ADMIN_VERIFY_URL:-https://www.dlbfyy.cn/login}"
DISPLAY_VERIFY_URL="${DISPLAY_VERIFY_URL:-https://www.dlbfyy.cn/display/}"
BACKEND_PUBLIC_HEALTHCHECK_URL="${BACKEND_PUBLIC_HEALTHCHECK_URL:-https://www.dlbfyy.cn/api/v1/health}"
VERIFY_DEPLOYMENTS="${VERIFY_DEPLOYMENTS:-1}"
VERIFY_TIMEOUT="${VERIFY_TIMEOUT:-15}"
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
  ./deploy.sh backend-release

常用配置：
  DEPLOY_USER=root
  DEPLOY_HOST=8.137.161.101
  DEPLOY_PORT=22
  SSH_KEY=~/.ssh/id_ed25519_tencent
  DEPLOY_BASE_DIR=/www/wwwroot/yuyingpets
  SKIP_BUILD=1
  REMOTE_NPM_INSTALL=0
  RUN_PRISMA_GENERATE=0
  VERIFY_DEPLOYMENTS=0
  CONTINUE_ON_ERROR=1

模块策略：
  admin-web   纯静态部署：本地构建 + rsync dist + 入口可用性校验
  display-app 静态部署：本地构建 + 资源版本号更新 + rsync + 页面可用性校验
  backend-precheck backend 首次迁移预检：检查运行目录、共享目录和资产目录状态
  backend-assets backend 静态资产同步：只同步 backend/public/assets
  backend-migrate backend 数据库迁移：执行 Prisma migration，并按登记表执行 sql/migrate_*.sql
  backend     版本化部署：上传到 releases + 远端安装依赖/生成 Prisma + 原子切换 + 健康检查 + 失败回滚
  backend-release 后端一键发布：预检 + 资产同步 + 数据库迁移 + backend 代码发布

backend 关键目录：
  BACKEND_REMOTE_DIR=$BACKEND_REMOTE_DIR           线上运行入口，部署后会成为指向当前版本的符号链接
  BACKEND_RELEASES_DIR=$BACKEND_RELEASES_DIR       版本目录
  BACKEND_SHARED_DIR=$BACKEND_SHARED_DIR           共享目录（.env / logs / public/assets / public/uploads）
  BACKEND_MIGRATE_REMOTE_DIR=$BACKEND_MIGRATE_REMOTE_DIR   迁移工作目录
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

shell_escape() {
  printf "%q" "$1"
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

verify_url() {
  local url="$1"
  local label="$2"

  if [ "$VERIFY_DEPLOYMENTS" != "1" ]; then
    return 0
  fi

  log "校验 $label: $url"
  curl -kfsSIL --connect-timeout 5 --max-time "$VERIFY_TIMEOUT" "$url" >/dev/null
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

  verify_url "$ADMIN_VERIFY_URL" "admin-web 登录页"
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

  verify_url "$DISPLAY_VERIFY_URL" "display-app 页面"
}

backend_precheck() {
  log "执行 backend 迁移预检"
  remote_exec "bash -lc $(shell_escape "$(cat <<EOF
set -euo pipefail
runtime=$(shell_escape "$BACKEND_REMOTE_DIR")
releases=$(shell_escape "$BACKEND_RELEASES_DIR")
shared=$(shell_escape "$BACKEND_SHARED_DIR")
assets=$(shell_escape "$BACKEND_ASSETS_REMOTE_DIR")

describe_path() {
  local target="\$1"
  if [ -L "\$target" ]; then
    printf '%s -> %s\n' "\$target" "\$(readlink -f "\$target" || readlink "\$target")"
  elif [ -d "\$target" ]; then
    printf '%s [directory]\n' "\$target"
  elif [ -e "\$target" ]; then
    printf '%s [file]\n' "\$target"
  else
    printf '%s [missing]\n' "\$target"
  fi
}

echo 'backend 运行入口状态:'
describe_path "\$runtime"
echo
echo 'backend 版本目录状态:'
describe_path "\$releases"
echo
echo 'backend 共享目录状态:'
describe_path "\$shared"
for item in .env logs public/assets public/uploads; do
  describe_path "\$shared/\$item"
done
echo
echo 'backend 资产目录状态:'
describe_path "\$assets"
EOF
)")"
}

deploy_backend_assets() {
  local asset_src="$PROJECT_ROOT/backend/public/assets/"
  local dry_run_cmd=()
  local sync_cmd=()
  local dry_run_output=""
  local output_file=""

  if [ ! -d "$asset_src" ]; then
    log "本地 backend/public/assets 不存在，跳过资产同步"
    return 0
  fi

  ensure_remote_dir "$BACKEND_ASSETS_REMOTE_DIR"

  dry_run_cmd=(rsync -azni -e "$RSYNC_SSH" --exclude '.DS_Store')
  sync_cmd=(rsync -az -e "$RSYNC_SSH" --exclude '.DS_Store')
  if [ "$BACKEND_ASSETS_DELETE" = "1" ]; then
    dry_run_cmd+=(--delete)
    sync_cmd+=(--delete)
  fi
  dry_run_cmd+=("$asset_src" "$REMOTE:$BACKEND_ASSETS_REMOTE_DIR/")
  sync_cmd+=("$asset_src" "$REMOTE:$BACKEND_ASSETS_REMOTE_DIR/")

  output_file="$(mktemp)"
  if ! "${dry_run_cmd[@]}" >"$output_file" 2>&1; then
    cat "$output_file" >&2
    rm -f "$output_file"
    return 1
  fi
  dry_run_output="$(cat "$output_file")"
  rm -f "$output_file"

  if [ -z "$(printf '%s\n' "$dry_run_output" | LC_ALL=C sed '/^sending incremental file list$/d;/^$/d;/^sent /d;/^total size is /d')" ]; then
    log "backend 资产无变化，跳过同步"
    return 0
  fi

  log "同步 backend 资产到 $REMOTE:$BACKEND_ASSETS_REMOTE_DIR"
  rsync_with_retry "${sync_cmd[@]}"
}

deploy_backend_migrate() {
  local remote_npm_install_cmd=""
  local remote_prisma_cmd="npm_config_loglevel=$(shell_escape "$NPM_LOG_LEVEL") npx prisma generate"
  local migrate_script

  log "准备 backend 迁移工作目录 $REMOTE:$BACKEND_MIGRATE_REMOTE_DIR"
  remote_exec "mkdir -p $(shell_escape "$BACKEND_MIGRATE_REMOTE_DIR")"

  rsync_with_retry -az --delete -e "$RSYNC_SSH" \
    --exclude '.env' \
    --exclude '.cache/' \
    --exclude 'node_modules/' \
    "$PROJECT_ROOT/backend/package.json" \
    "$PROJECT_ROOT/backend/package-lock.json" \
    "$PROJECT_ROOT/backend/prisma" \
    "$PROJECT_ROOT/backend/sql" \
    "$REMOTE:$BACKEND_MIGRATE_REMOTE_DIR/"

  if [ -n "$REMOTE_NPM_REGISTRY" ]; then
    remote_npm_install_cmd="npm config set registry $(shell_escape "$REMOTE_NPM_REGISTRY") && "
  fi
  remote_npm_install_cmd="${remote_npm_install_cmd}if [ -f package-lock.json ]; then npm ci --loglevel=$(shell_escape "$NPM_LOG_LEVEL") ${NPM_INSTALL_FLAGS}; else npm install --loglevel=$(shell_escape "$NPM_LOG_LEVEL") ${NPM_INSTALL_FLAGS}; fi"

  migrate_script=$(cat <<'EOF'
set -euo pipefail

workspace=__WORKSPACE__
shared=__SHARED__
history_table=__HISTORY_TABLE__
bootstrap_mode=__BOOTSTRAP_MODE__
npm_cmd=__NPM_CMD__
prisma_cmd=__PRISMA_CMD__

if [ ! -e "$shared/.env" ] && [ -e __BACKEND_RUNTIME__/.env ]; then
  mkdir -p "$shared"
  cp -a __BACKEND_RUNTIME__/.env "$shared/.env"
fi

if [ ! -e "$shared/.env" ]; then
  echo '错误：未找到 backend 共享 .env，无法执行数据库迁移'
  exit 1
fi

cd "$workspace"
ln -sfn "$shared/.env" .env
eval "$npm_cmd"
eval "$prisma_cmd"

echo '提示：执行 prisma migrate deploy'
npx prisma migrate deploy --schema prisma/schema.prisma

echo '提示：检查待执行 sql/migrate_*.sql'
node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const historyTable = process.env.SQL_HISTORY_TABLE || 'deploy_sql_history';
const bootstrapMode = process.env.SQL_BOOTSTRAP_MODE || 'baseline-existing';
const sqlDir = path.join(process.cwd(), 'sql');

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`${historyTable}\` (
        id BIGINT NOT NULL AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_filename (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const files = fs.existsSync(sqlDir)
      ? fs.readdirSync(sqlDir)
          .filter((name) => /^migrate_.*\.sql$/.test(name))
          .sort()
      : [];

    if (files.length === 0) {
      console.log('提示：没有匹配的 migrate_*.sql，跳过手写 SQL');
      return;
    }

    const historyCountRows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) AS count FROM \`${historyTable}\``,
    );
    const historyCount = Number(historyCountRows[0]?.count || 0);

    if (historyCount === 0 && bootstrapMode === 'baseline-existing') {
      console.log('提示：首次启用 SQL 登记表，按 baseline-existing 将现有 migrate_*.sql 标记为已执行');
      for (const file of files) {
        const fullPath = path.join(sqlDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const checksum = crypto.createHash('sha256').update(content).digest('hex');
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`${historyTable}\` (filename, checksum) VALUES (?, ?)`,
          file,
          checksum,
        );
      }
      return;
    }

    let executedAny = false;

    for (const file of files) {
      const fullPath = path.join(sqlDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(content).digest('hex');
      const rows = await prisma.$queryRawUnsafe(
        `SELECT checksum FROM \`${historyTable}\` WHERE filename = ? LIMIT 1`,
        file,
      );

      if (rows.length > 0) {
        if (rows[0].checksum !== checksum) {
          throw new Error(`SQL 文件已执行但内容发生变化: ${file}`);
        }
        console.log(`提示：SQL 已执行，跳过 ${file}`);
        continue;
      }

      console.log(`提示：执行 SQL ${file}`);
      execFileSync('npx', ['prisma', 'db', 'execute', '--schema', 'prisma/schema.prisma', '--file', fullPath], {
        stdio: 'inherit',
      });
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`${historyTable}\` (filename, checksum) VALUES (?, ?)`,
        file,
        checksum,
      );
      executedAny = true;
    }

    if (!executedAny) {
      console.log('提示：没有新的手写 SQL 需要执行');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
NODE
EOF
)
  migrate_script="${migrate_script//__WORKSPACE__/$(shell_escape "$BACKEND_MIGRATE_REMOTE_DIR")}"
  migrate_script="${migrate_script//__SHARED__/$(shell_escape "$BACKEND_SHARED_DIR")}"
  migrate_script="${migrate_script//__HISTORY_TABLE__/$(shell_escape "$BACKEND_SQL_HISTORY_TABLE")}"
  migrate_script="${migrate_script//__BOOTSTRAP_MODE__/$(shell_escape "$BACKEND_SQL_BOOTSTRAP_MODE")}"
  migrate_script="${migrate_script//__NPM_CMD__/$(shell_escape "$remote_npm_install_cmd")}"
  migrate_script="${migrate_script//__PRISMA_CMD__/$(shell_escape "$remote_prisma_cmd")}"
  migrate_script="${migrate_script//__BACKEND_RUNTIME__/$(shell_escape "$BACKEND_REMOTE_DIR")}"

  log "执行 backend 数据库迁移"
  remote_exec "cd $(shell_escape "$BACKEND_MIGRATE_REMOTE_DIR") && SQL_HISTORY_TABLE=$(shell_escape "$BACKEND_SQL_HISTORY_TABLE") SQL_BOOTSTRAP_MODE=$(shell_escape "$BACKEND_SQL_BOOTSTRAP_MODE") bash -lc $(shell_escape "$migrate_script")"
}

deploy_backend() {
  build_backend

  local release_id
  local release_dir
  local remote_healthcheck_url
  local upload_script
  local remote_npm_install_cmd=""
  local remote_prisma_cmd=""
  local release_script

  release_id="$(date +%Y%m%d%H%M%S)"
  release_dir="${BACKEND_RELEASES_DIR}/${release_id}"
  remote_healthcheck_url="http://${BACKEND_HEALTHCHECK_HOST}:${BACKEND_HEALTHCHECK_PORT}${BACKEND_HEALTHCHECK_PATH}"

  if [ -n "$REMOTE_NPM_REGISTRY" ]; then
    remote_npm_install_cmd="npm config set registry $(shell_escape "$REMOTE_NPM_REGISTRY") && "
  fi

  if [ "$REMOTE_NPM_INSTALL" = "1" ]; then
    remote_npm_install_cmd="${remote_npm_install_cmd}if [ -f package-lock.json ]; then npm ci --loglevel=$(shell_escape "$NPM_LOG_LEVEL") ${NPM_INSTALL_FLAGS}; else npm install --loglevel=$(shell_escape "$NPM_LOG_LEVEL") ${NPM_INSTALL_FLAGS}; fi"
  else
    remote_npm_install_cmd=":"
  fi

  if [ "$RUN_PRISMA_GENERATE" = "1" ]; then
    remote_prisma_cmd="npm_config_loglevel=$(shell_escape "$NPM_LOG_LEVEL") npx prisma generate"
  else
    remote_prisma_cmd=":"
  fi

  log "准备 backend 版本目录 $REMOTE:$release_dir"
  upload_script=$(cat <<EOF
set -euo pipefail
mkdir -p $(shell_escape "$BACKEND_RELEASES_DIR") $(shell_escape "$BACKEND_SHARED_DIR")
rm -rf $(shell_escape "$release_dir")
mkdir -p $(shell_escape "$release_dir")
EOF
)
  remote_exec "bash -lc $(shell_escape "$upload_script")"

  log "上传 backend 到版本目录 $REMOTE:$release_dir"
  rsync_with_retry -az -e "$RSYNC_SSH" \
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
    "$REMOTE:$release_dir/"

  release_script=$(cat <<EOF
set -euo pipefail

runtime=$(shell_escape "$BACKEND_REMOTE_DIR")
release=$(shell_escape "$release_dir")
releases_dir=$(shell_escape "$BACKEND_RELEASES_DIR")
shared=$(shell_escape "$BACKEND_SHARED_DIR")
restart_cmd=$(shell_escape "$BACKEND_RESTART_CMD")
health_url=$(shell_escape "$remote_healthcheck_url")
health_retries=$(shell_escape "$BACKEND_HEALTHCHECK_RETRIES")
health_interval=$(shell_escape "$BACKEND_HEALTHCHECK_INTERVAL")
health_initial_delay=$(shell_escape "$BACKEND_HEALTHCHECK_INITIAL_DELAY")
keep_failed_release=$(shell_escape "$BACKEND_KEEP_FAILED_RELEASE")
release_keep=$(shell_escape "$BACKEND_RELEASE_KEEP")
pm2_app=$(shell_escape "$BACKEND_PM2_APP_NAME")
npm_cmd=$(shell_escape "$remote_npm_install_cmd")
prisma_cmd=$(shell_escape "$remote_prisma_cmd")

copy_if_missing() {
  local source_path="\$1"
  local target_path="\$2"
  if [ -e "\$source_path" ] && [ ! -e "\$target_path" ]; then
    mkdir -p "\$(dirname "\$target_path")"
    cp -a "\$source_path" "\$target_path"
  fi
}

sync_dir_if_target_empty() {
  local source_dir="\$1"
  local target_dir="\$2"
  if [ -d "\$source_dir" ] && [ -z "\$(ls -A "\$target_dir" 2>/dev/null || true)" ]; then
    mkdir -p "\$target_dir"
    rsync -a "\$source_dir"/ "\$target_dir"/
  fi
}

mkdir -p "\$shared/logs" "\$shared/public/assets" "\$shared/public/uploads"

existing_runtime=""
previous_target=""
legacy_backup=""
if [ -L "\$runtime" ]; then
  previous_target="\$(readlink -f "\$runtime" || true)"
  existing_runtime="\$previous_target"
elif [ -d "\$runtime" ]; then
  existing_runtime="\$runtime"
fi

if [ -n "\$existing_runtime" ]; then
  echo "提示：检测到现有 backend 运行目录 \$existing_runtime"
  copy_if_missing "\$existing_runtime/.env" "\$shared/.env"
  sync_dir_if_target_empty "\$existing_runtime/public/assets" "\$shared/public/assets"
  sync_dir_if_target_empty "\$existing_runtime/public/uploads" "\$shared/public/uploads"
fi

mkdir -p "\$release/public"
rm -rf "\$release/logs" "\$release/public/assets" "\$release/public/uploads" "\$release/.env"
echo "提示：共享 .env 路径 \$shared/.env"
echo "提示：共享日志目录 \$shared/logs"
echo "提示：共享 assets 目录 \$shared/public/assets"
echo "提示：共享 uploads 目录 \$shared/public/uploads"
ln -sfn "\$shared/logs" "\$release/logs"
ln -sfn "\$shared/public/assets" "\$release/public/assets"
ln -sfn "\$shared/public/uploads" "\$release/public/uploads"
if [ -e "\$shared/.env" ]; then
  ln -sfn "\$shared/.env" "\$release/.env"
fi

cd "\$release"
eval "\$npm_cmd"
eval "\$prisma_cmd"

test -f dist/main.js
test -f node_modules/@nestjs/common/package.json

rollback() {
  echo '提示：开始执行 backend 回滚'
  if [ -n "\$previous_target" ]; then
    ln -sfn "\$previous_target" "\${runtime}.next"
    mv -Tf "\${runtime}.next" "\$runtime"
  elif [ -n "\$legacy_backup" ] && [ -d "\$legacy_backup" ]; then
    rm -f "\$runtime"
    mv "\$legacy_backup" "\$runtime"
  else
    rm -f "\$runtime"
  fi

  if [ -e "\$runtime" ]; then
    (
      cd "\$runtime"
      restart_backend
    ) || true
  fi

  if [ "\$keep_failed_release" != "1" ]; then
    rm -rf "\$release"
  fi
}

if [ -e "\$runtime" ] && [ ! -L "\$runtime" ]; then
  legacy_backup="\${releases_dir}/legacy-runtime-before-\$(basename "\$release")"
  rm -rf "\$legacy_backup"
  echo "提示：首次迁移 backend 目录，将现有目录备份到 \$legacy_backup"
  mv "\$runtime" "\$legacy_backup"
fi

mkdir -p "\$(dirname "\$runtime")"
echo "提示：将 backend 运行入口切换为符号链接 \$runtime -> \$release"
ln -sfn "\$release" "\${runtime}.next"
mv -Tf "\${runtime}.next" "\$runtime"

restart_backend() {
  if eval "\$restart_cmd"; then
    return 0
  fi
  pm2 delete "\$pm2_app" >/dev/null 2>&1 || true
  eval "\$restart_cmd"
}

if ! (
  cd "\$runtime"
  restart_backend
); then
  rollback
  echo '错误：backend 重启失败，已尝试回滚'
  exit 1
fi

sleep "\$health_initial_delay"
attempt=1
until curl -fsS --connect-timeout 2 --max-time 5 "\$health_url" >/dev/null; do
  if [ "\$attempt" -ge "\$health_retries" ]; then
    rollback
    echo '错误：backend 健康检查失败，已尝试回滚'
    pm2 status "\$pm2_app" || pm2 status || true
    tail -n 80 "\$shared/logs/error.log" 2>/dev/null || true
    exit 1
  fi
  sleep "\$health_interval"
  attempt=\$((attempt + 1))
done

current_target="\$(readlink -f "\$runtime" || true)"
if [ -n "\$current_target" ]; then
  mapfile -t all_releases < <(find "\$releases_dir" -mindepth 1 -maxdepth 1 -type d -name '20*' | sort -r)
  kept=0
  for candidate in "\${all_releases[@]}"; do
    if [ "\$candidate" = "\$current_target" ]; then
      kept=\$((kept + 1))
      continue
    fi
    kept=\$((kept + 1))
    if [ "\$kept" -le "\$release_keep" ]; then
      continue
    fi
    rm -rf "\$candidate"
  done
fi

echo "提示：backend 发布成功，当前版本目录 \$release"
EOF
)

  log "在服务器端安装 backend 依赖、准备共享目录并原子切换版本"
  remote_exec "bash -lc $(shell_escape "$release_script")"

  verify_url "$BACKEND_PUBLIC_HEALTHCHECK_URL" "backend 公网健康检查"
}

deploy_backend_release() {
  backend_precheck
  deploy_backend_assets
  deploy_backend_migrate
  deploy_backend
}

run_target() {
  case "$1" in
    admin-web)
      deploy_admin_web
      ;;
    display-app)
      deploy_display_app
      ;;
    backend-precheck)
      backend_precheck
      ;;
    backend-assets)
      deploy_backend_assets
      ;;
    backend-migrate)
      deploy_backend_migrate
      ;;
    backend)
      deploy_backend
      ;;
    backend-release)
      deploy_backend_release
      ;;
  esac
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
    backend-precheck|precheck)
      echo "backend-precheck"
      ;;
    backend-assets|assets)
      echo "backend-assets"
      ;;
    backend-migrate|migrate)
      echo "backend-migrate"
      ;;
    backend-release|release)
      echo "backend-release"
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
  require_command curl

  local targets=()
  local arg normalized
  for arg in "$@"; do
    normalized="$(normalize_target "$arg")"
    case "$normalized" in
      admin-web|display-app|backend|backend-precheck|backend-assets|backend-migrate|backend-release)
        targets+=("$normalized")
        ;;
      all)
        targets=(admin-web display-app backend-release)
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
    local target_status=0
    set +e
    (set -e; run_target "$target")
    target_status=$?
    set -e
    if [ "$target_status" -ne 0 ]; then
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
