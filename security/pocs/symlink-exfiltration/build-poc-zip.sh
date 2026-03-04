#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$BASE_DIR/symlink-exfiltration-poc.zip"

rm -f "$OUT"
(
  cd "$BASE_DIR"
  zip -r "$OUT" poc-repo reproduce.sh README.md >/dev/null
)

echo "Created: $OUT"
