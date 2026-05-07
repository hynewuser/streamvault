#!/usr/bin/env bash
# Hot backup the SQLite DB + exports folder.
set -euo pipefail
ts=$(date -u +"%Y%m%d-%H%M%S")
out="./backups/streamvault-${ts}.tar.gz"
mkdir -p ./backups
tar czf "$out" backend/data exports
echo "✅ backup -> $out"
