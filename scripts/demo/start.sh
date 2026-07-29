#!/usr/bin/env bash
# Nyalain demo online: ngrok tunnel (api/web/admin) + dev server semua app.
# URL ngrok berubah tiap kali script ini dijalankan (akun free), jadi script
# ini otomatis nulis ulang URL ke semua .env yang butuh + ke DB (gambar produk).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT/scripts/demo/.run"
mkdir -p "$RUN_DIR"

echo "==> Membersihkan proses demo lama (kalau ada)..."
"$ROOT/scripts/demo/stop.sh" || true

echo "==> Mengecek Postgres di localhost:5433..."
if ! pg_isready -h localhost -p 5433 >/dev/null 2>&1; then
  echo "Postgres belum jalan di localhost:5433. Nyalakan dulu, lalu jalankan script ini lagi." >&2
  exit 1
fi

echo "==> Menyalakan ngrok (3 tunnel: api, web, admin)..."
nohup ngrok start --all \
  --config "$HOME/.config/ngrok/ngrok.yml" \
  --config "$ROOT/scripts/demo/ngrok-tunnels.yml" \
  --log="$RUN_DIR/ngrok.log" > /dev/null 2>&1 &
echo $! > "$RUN_DIR/ngrok.pid"

echo "==> Menunggu tunnel ngrok siap..."
for i in $(seq 1 30); do
  TUNNELS_JSON="$(curl -s http://127.0.0.1:4040/api/tunnels || true)"
  COUNT="$(echo "$TUNNELS_JSON" | python3 -c "import json,sys;print(len(json.load(sys.stdin).get('tunnels',[])))" 2>/dev/null || echo 0)"
  [ "$COUNT" = "3" ] && break
  sleep 1
done
if [ "$COUNT" != "3" ]; then
  echo "Tunnel ngrok gagal nyala. Cek log: $RUN_DIR/ngrok.log" >&2
  exit 1
fi

API_URL="$(echo "$TUNNELS_JSON" | python3 -c "import json,sys;d=json.load(sys.stdin);print([t['public_url'] for t in d['tunnels'] if t['name']=='api'][0])")"
WEB_URL="$(echo "$TUNNELS_JSON" | python3 -c "import json,sys;d=json.load(sys.stdin);print([t['public_url'] for t in d['tunnels'] if t['name']=='web'][0])")"
ADMIN_URL="$(echo "$TUNNELS_JSON" | python3 -c "import json,sys;d=json.load(sys.stdin);print([t['public_url'] for t in d['tunnels'] if t['name']=='admin'][0])")"

echo "==> URL didapat:"
echo "    web:   $WEB_URL"
echo "    admin: $ADMIN_URL"
echo "    api:   $API_URL"

echo "==> Update apps/web/.env.local"
sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" "$ROOT/apps/web/.env.local"

echo "==> Update apps/admin/.env"
sed -i "s|^VITE_API_URL=.*|VITE_API_URL=$API_URL|" "$ROOT/apps/admin/.env"

echo "==> Update apps/api/.env"
sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$WEB_URL|" "$ROOT/apps/api/.env"
sed -i "s|^ADMIN_URL=.*|ADMIN_URL=$ADMIN_URL|" "$ROOT/apps/api/.env"
sed -i "s|^API_PUBLIC_URL=.*|API_PUBLIC_URL=$API_URL|" "$ROOT/apps/api/.env"
grep -q "^ADMIN_URL=" "$ROOT/apps/api/.env" || echo "ADMIN_URL=$ADMIN_URL" >> "$ROOT/apps/api/.env"

echo "==> Menyalakan api + web + admin (pnpm dev)..."
cd "$ROOT"
nohup pnpm dev > "$RUN_DIR/dev.log" 2>&1 &
echo $! > "$RUN_DIR/dev.pid"

echo "==> Menunggu ketiga app siap (maks 60 detik)..."
for i in $(seq 1 60); do
  UP=0
  ss -ltn 2>/dev/null | grep -q ":3000 " && UP=$((UP+1))
  ss -ltn 2>/dev/null | grep -q ":4000 " && UP=$((UP+1))
  ss -ltn 2>/dev/null | grep -q ":5173 " && UP=$((UP+1))
  [ "$UP" = "3" ] && break
  sleep 1
done
if [ "$UP" != "3" ]; then
  echo "Ada app yang belum nyala setelah 60 detik. Cek log: $RUN_DIR/dev.log" >&2
fi

echo "==> Menyamakan URL gambar produk lama di database ke tunnel baru..."
DB_URL="$(grep '^DATABASE_URL=' "$ROOT/apps/api/.env" | cut -d= -f2-)"
psql "$DB_URL" -c "UPDATE \"ProductImage\" SET url = '${API_URL}' || '/uploads/' || split_part(url, '/uploads/', 2) WHERE url LIKE '%/uploads/%';" > /dev/null

echo
echo "Demo online siap:"
echo "  Web:   $WEB_URL"
echo "  Admin: $ADMIN_URL"
echo "  API:   $API_URL"
echo
echo "(Pengunjung akan lihat halaman peringatan ngrok sebentar saat pertama buka, tinggal klik \"Visit Site\".)"
