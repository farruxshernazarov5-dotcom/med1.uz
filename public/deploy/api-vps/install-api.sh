#!/usr/bin/env bash
# api.med1.uz — Med1 API Gateway reverse proxy o'rnatish (VDS: 89.39.95.5)
# Ishlatish:  sudo bash install-api.sh
# Agar fayllarni qo'lda yuklagan bo'lsangiz, shu katalogda nginx-api.med1.uz.conf bo'lishi kerak.
set -euo pipefail

DOMAIN="api.med1.uz"
SNIPPET="/etc/nginx/snippets/med1-pay-proxy.conf"
CONF_SRC="$(dirname "$0")/nginx-api.med1.uz.conf"
PUBLIC_URL="https://med1.uz/deploy/api-vps/nginx-api.med1.uz.conf"

# Agar lokal konfig yo'q bo'lsa — production URL'dan yuklab olamiz (faqat bir fayl).
if [ ! -f "$CONF_SRC" ]; then
  echo "==> local nginx konfiguratsiyasi topilmadi, $PUBLIC_URL dan yuklanmoqda"
  TMP_CONF="/tmp/nginx-api.med1.uz.conf"
  curl -fsSL "$PUBLIC_URL" -o "$TMP_CONF"
  CONF_SRC="$TMP_CONF"
fi

echo "==> 1/6 Hostname va DNS tekshiruvi"
HN="$(hostname)"
grep -q "127.0.1.1[[:space:]]\+$HN" /etc/hosts || echo "127.0.1.1 $HN" >> /etc/hosts
if ! getent hosts med1.uz >/dev/null 2>&1; then
  printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' > /etc/resolv.conf
fi
if ! getent ahostsv4 "$DOMAIN" >/dev/null 2>&1; then
  echo "Xato: $DOMAIN DNS'da topilmadi. A yozuvi 89.39.95.5 ga yo'naltirilganini tekshiring." >&2
  exit 1
fi

echo "==> 2/6 Nginx va certbot"
apt-get update -y >/dev/null 2>&1 || true
apt-get install -y nginx certbot python3-certbot-nginx curl >/dev/null 2>&1 || true

echo "==> 3/6 Proxy snippet"
mkdir -p /etc/nginx/snippets
if [ ! -f "$SNIPPET" ]; then
cat > "$SNIPPET" <<'EOF'
proxy_http_version 1.1;
proxy_ssl_server_name on;
proxy_ssl_name wiqcfyecdmararxqdmfk.supabase.co;
proxy_set_header Host wiqcfyecdmararxqdmfk.supabase.co;
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
proxy_connect_timeout 15s;
proxy_send_timeout 60s;
proxy_read_timeout 120s;
EOF
fi

echo "==> 4/6 Eski api.med1* konfiguratsiyalarini tozalash"
rm -f /etc/nginx/sites-enabled/api.med1* /etc/nginx/sites-available/api.med1* || true
find /etc/nginx/sites-enabled -xtype l -delete 2>/dev/null || true

echo "==> 5/6 Yangi konfiguratsiya"
cp "$CONF_SRC" /etc/nginx/sites-available/api.med1.uz.conf
ln -sf /etc/nginx/sites-available/api.med1.uz.conf /etc/nginx/sites-enabled/api.med1.uz.conf
nginx -t
systemctl reload nginx

echo "==> 6/6 HTTPS sertifikat"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@med1.uz --redirect || \
  echo "!! certbot bajarilmadi — DNS A yozuvi 89.39.95.5 ga yo'naltirilganini tekshiring"

echo

echo "== Self-test =="
curl -s -o /dev/null -w "http health: %{http_code}\n" "http://$DOMAIN/health" || true
curl -s -o /dev/null -w "https health: %{http_code}\n" "https://$DOMAIN/health" || true
curl -s -o /dev/null -w "https /v1/ping (no key): %{http_code}\n" "https://$DOMAIN/v1/ping" || true
echo "Tayyor."
