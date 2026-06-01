#!/usr/bin/env bash

set -euo pipefail

# 兼容旧入口：实际逻辑统一交给 github.sh，避免维护两套备份脚本。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/github.sh" "$@"
