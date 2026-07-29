#!/usr/bin/env bash
# Matiin semua proses demo online: ngrok + api/web/admin dev server.
set -uo pipefail

echo "==> Mematikan ngrok..."
pkill -f "ngrok start --all --config" 2>/dev/null || true

echo "==> Mematikan dev server (api/web/admin) via port 3000/4000/5173..."
fuser -k 3000/tcp 4000/tcp 5173/tcp 2>/dev/null || true

echo "==> Mematikan proses turbo/pnpm dev yang masih nyangkut..."
pkill -f "turbo run dev" 2>/dev/null || true
pkill -f "nest.js start --watch" 2>/dev/null || true
pkill -f "vite/bin/vite.js" 2>/dev/null || true
pkill -f "next/dist/bin/next dev" 2>/dev/null || true

sleep 1
echo "==> Selesai."
