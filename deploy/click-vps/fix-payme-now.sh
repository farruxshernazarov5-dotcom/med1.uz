#!/usr/bin/env bash
# MED1.UZ — pay.med1.uz to'lov proxysini NOLDAN tiklash (Click + Payme + Uzum)
# VDS (89.39.95.5) da root sifatida ishga tushiring:
#   sudo EMAIL=billing@med1.uz bash fix-payme-now.sh
set -euo pipefail

SB="https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1"
SB_HOST="wiqcfyecdmararxqdmfk.supabase.co"
CONF=/etc/nginx/sites-available/pay.med1.uz.conf
MARKER="2026-09-02-v4"
EMAIL="${EMAIL:-billing@med1.uz}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Xato: root sifatida ishga tushiring: sudo bash fix-payme-now.sh" >&2
  exit 1
fi

echo "==> 1/6 hostname va DNS tiklanmoqda"
VDS_HOSTNAME="$(hostname)"
if ! grep -Eq "(^|[[:space:]])${VDS_HOSTNAME}([[:space:]]|$)" /etc/hosts; then
  printf '127.0.1.1 %s\n' "$VDS_HOSTNAME" >> /etc/hosts
fi

if ! getent ahostsv4 med1.uz >/dev/null 2>&1; then
  if systemctl is-active --quiet systemd-resolved 2>/dev/null; then
    mkdir -p /etc/systemd/resolved.conf.d
    cat > /etc/systemd/resolved.conf.d/med1-dns.conf <<'DNS'
[Resolve]
DNS=1.1.1.1 8.8.8.8
FallbackDNS=9.9.9.9
DNSSEC=allow-downgrade
DNS
    systemctl restart systemd-resolved
  else
    cp -a /etc/resolv.conf "/etc/resolv.conf.med1-backup-$(date +%s)" || true
    cat > /etc/resolv.conf <<'DNS'
nameserver 1.1.1.1
nameserver 8.8.8.8
DNS
  fi
fi
getent ahostsv4 med1.uz >/dev/null || {
  echo "Xato: VDS tashqi DNS nomlarini hali ham aniqlay olmayapti." >&2
  exit 1
}

echo "==> 2/6 nginx o'rnatilmoqda (kerak bo'lsa)"
command -v nginx >/dev/null || {
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx curl
}
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

echo "==> 3/6 eski va buzuq konfiguratsiyalar tozalanmoqda"
# Barcha buzuq/eski pay.med1* fayllar (masalan pay.med1.uzy, pay.med1server) o'chiriladi.
find /etc/nginx/sites-enabled -maxdepth 1 -name 'pay.med1*' -exec rm -f {} + 2>/dev/null || true
find /etc/nginx/sites-available -maxdepth 1 -name 'pay.med1*' -exec rm -f {} + 2>/dev/null || true
find /etc/nginx/conf.d -maxdepth 1 -name 'pay.med1*' -exec rm -f {} + 2>/dev/null || true
find /etc/nginx/sites-enabled -xtype l -delete 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default

echo "==> 4/6 yangi konfiguratsiya yozilmoqda (${MARKER})"
proxy_block() {
  cat <<EOF
        limit_except GET POST OPTIONS { deny all; }
        proxy_pass $SB/$1;
        proxy_ssl_server_name on;
        proxy_ssl_name $SB_HOST;
        proxy_set_header Host $SB_HOST;
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
  echo "    add_header X-Med1-Proxy-Config \"${MARKER}\" always;"
  echo '    client_max_body_size 1m;'
  echo ''
  echo '    location = /health {'
  echo '        default_type application/json;'
  echo '        add_header Cache-Control "no-store" always;'
  echo "        return 200 '{\"ok\":true,\"service\":\"med1-payment-tasix-proxy\",\"ip\":\"89.39.95.5\",\"config\":\"${MARKER}\"}';"
  echo '    }'
  echo ''
  echo '    location = / { return 302 https://med1.uz/payment/success; }'
  echo ''
  for p in "/click/prepare click-prepare" "/click-prepare click-prepare" \
           "/click/complete click-complete" "/click-complete click-complete" \
           "/click/webhook click-webhook" \
           "/payme payme-webhook" "/payme/ payme-webhook" "/api/payme payme-webhook" \
           "/uzum uzum-webhook" "/uzum/ uzum-webhook" "/api/uzum uzum-webhook" \
           "/payment/webhook payment-webhook" "/api/payment payment-webhook"; do
    set -- $p
    echo "    location = $1 {"
    proxy_block "$2"
    echo '    }'
    echo ''
  done
  echo '    location / { return 404; }'
  echo '}'
} > "$CONF"

ln -sfn "$CONF" /etc/nginx/sites-enabled/pay.med1.uz.conf

echo "==> 5/6 nginx tekshiruvi va HTTPS"
nginx -t
systemctl enable --now nginx
systemctl reload nginx

certbot --nginx --non-interactive --agree-tos --redirect \
  --email "${EMAIL}" -d pay.med1.uz || true
nginx -t && systemctl reload nginx

echo "==> 6/6 self-test"
for u in /health / /click/prepare /click/complete /click-prepare /click-complete /payme /uzum; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://127.0.0.1$u" -H 'Host: pay.med1.uz' -H 'Content-Type: application/json' -d '{}')
  echo "  $u -> $code"
done
echo "Payme javobi:"
curl -s -X POST http://127.0.0.1/payme -H 'Host: pay.med1.uz' -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"CheckPerformTransaction","params":{"amount":5000,"account":{}}}'
echo
echo "Tayyor. /health ichida \"config\":\"${MARKER}\" ko'rinishi shart."
