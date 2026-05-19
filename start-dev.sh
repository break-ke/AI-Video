#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " Video Marketing Platform — Dev Startup"
echo "========================================"

# ── Prerequisites ──
echo ""
echo "[1/5] Checking environment..."

NODE_VERSION=$(node -v 2>/dev/null || echo "none")
if [ "$NODE_VERSION" = "none" ]; then
  echo "  ERROR: Node.js not found. Install Node >=22."
  exit 1
fi
echo "  Node: $NODE_VERSION"

if ! command -v pnpm &>/dev/null; then
  echo "  WARNING: pnpm not found. Installing via corepack..."
  corepack enable
  corepack prepare pnpm@9.15.0 --activate
fi
echo "  pnpm: $(pnpm -v)"

# ── Install dependencies ──
echo ""
echo "[2/5] Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# ── Generate Prisma client ──
echo ""
echo "[3/5] Generating Prisma client..."
pnpm --filter @platform/database db:generate

# ── Push database schema (SQLite, idempotent) ──
echo ""
echo "[4/5] Syncing database schema..."
pnpm --filter @platform/database db:push

# ── Start dev server ──
echo ""
echo "[5/5] Starting dev server on http://localhost:3100 ..."
echo "========================================"
echo ""
pnpm dev
