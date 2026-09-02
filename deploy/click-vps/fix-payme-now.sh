#!/usr/bin/env bash
# MED1.UZ — pay.med1.uz nginx konfiguratsiyasini YANGILASH (Payme + Click)
# VPS (89.39.95.5) da root sifatida ishga tushiring:
#   sudo bash fix-payme-now.sh
set -euo pipefail

SB="https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1"
CONF=/etc/nginx/sites-available/pay.med1.uz.conf

proxy_block() {
  cat <<EOF
        proxy_pass $SB/$1;
        proxy_ssl_server_name on;
        proxy_set_header Host wiqcfyecdmararxqdmfk.supabase.co;
        proxy_set_header Authorization \$http_authorization;
        proxy_pass_header Authorization;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_pass_request_body on;
        proxy_request_buffering off;
        proxy_buffering off;
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_intercept_errors off;
        add_header X-Med1-Tasix-Proxy "89.39.95.5" always;
EOF
}

{
  echo 'server {'
  echo '    listen 80;'
  echo '    listen [::]:80;'
  echo '    server_name pay.med1.uz;'
  echo '    add_header X-Med1-Proxy-Config "2026-09-02-v3" always;'
  echo '    client_max_body_size 1m;'
  echo ''
  echo '    location = /health {'
  echo '        default_type application/json;'
  echo '        add_header Cache-Control "no-store" always;'
  echo '        return 200 '"'"'{"ok":true,"service":"med1-payment-tasix-proxy","ip":"89.39.95.5","config":"2026-09-02-v3"}'"'"';'
  echo '    }'
  echo ''
  echo '    location = / { return 302 https://med1.uz/payment/success; }'
  echo ''
  for p in "/click/prepare click-prepare" "/click-prepare click-prepare" \
           "/click/complete click-complete" "/click-complete click-complete" \
           "/payme payme-webhook" "/payme/ payme-webhook" "/api/payme payme-webhook"; do
    set -- $p
    echo "    location = $1 {"
    echo '        limit_except GET POST OPTIONS { deny all; }'
    proxy_block "$2"
    echo '    }'
    echo ''
  done
  echo '    location / { return 404; }'
  echo '}'
} > "$CONF"

ln -sf "$CONF" /etc/nginx/sites-enabled/pay.med1.uz.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# HTTPS ni tiklash (sertifikat allaqachon bor bo'lsa qayta ishlatiladi)
certbot --nginx --non-interactive --agree-tos --redirect \
  --email "${EMAIL:-billing@med1.uz}" -d pay.med1.uz || true
nginx -t && systemctl reload nginx

echo "--- self-test ---"
for u in /health /payme /click/prepare /click/complete; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://127.0.0.1$u" -H 'Host: pay.med1.uz' -H 'Content-Type: application/json' -d '{}')
  echo "$u -> $code"
done
echo "Payme javobi:"
curl -s -X POST http://127.0.0.1/payme -H 'Host: pay.med1.uz' -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"CheckPerformTransaction","params":{"amount":5000,"account":{}}}'
echo
