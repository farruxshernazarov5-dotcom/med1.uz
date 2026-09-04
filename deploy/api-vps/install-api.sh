#!/usr/bin/env bash
# api.med1.uz — Med1 API Gateway reverse proxy o'rnatish (VDS: 89.39.95.5)
# Ishlatish:  sudo bash install-api.sh
set -euo pipefail

DOMAIN="api.med1.uz"
SNIPPET="/etc/nginx/snippets/med1-pay-proxy.conf"

echo "==> 1/6 Hostname va DNS tekshiruvi"
HN="$(hostname)"
grep -q "127.0.1.1[[:space:]]\+$HN" /etc/hosts || echo "127.0.1.1 $HN" >> /etc/hosts
if ! getent hosts med1.uz >/dev/null 2>&1; then
  printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' > /etc/resolv.conf
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

echo "==> 5/6 Yangi konfiguratsiya"
cp "$(dirname "$0")/nginx-api.med1.uz.conf" /etc/nginx/sites-available/api.med1.uz.conf
ln -sf /etc/nginx/sites-available/api.med1.uz.conf /etc/nginx/sites-enabled/api.med1.uz.conf
nginx -t
systemctl reload nginx

echo "==> 6/6 HTTPS sertifikat"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@med1.uz --redirect || \
  echo "!! certbot bajarilmadi — DNS A yozuvi 89.39.95.5 ga yo'naltirilganini tekshiring"

echo
echo "== Self-test =="
curl -s -o /dev/null -w "health: %{http_code}\n" "https://$DOMAIN/health" || true
curl -s -o /dev/null -w "/v1/health: %{http_code}\n" "https://$DOMAIN/v1/health" || true
echo "Tayyor."
