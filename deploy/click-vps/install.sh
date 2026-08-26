#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="pay.med1.uz"
EXPECTED_IP="89.39.95.5"
EMAIL="${1:-}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Xato: sudo bilan ishga tushiring: sudo bash install.sh billing@med1.uz" >&2
  exit 1
fi

if [[ -z "${EMAIL}" || "${EMAIL}" != *@* ]]; then
  echo "Xato: Let's Encrypt uchun email kiriting: sudo bash install.sh billing@med1.uz" >&2
  exit 1
fi

CURRENT_IP="$(getent ahostsv4 "${DOMAIN}" | awk 'NR==1 {print $1}')"
if [[ "${CURRENT_IP}" != "${EXPECTED_IP}" ]]; then
  echo "Xato: ${DOMAIN} A-record hozir '${CURRENT_IP:-topilmadi}', '${EXPECTED_IP}' bo'lishi kerak." >&2
  echo "DNS yozuvini yarating, tarqalishini kuting va skriptni qayta ishga tushiring." >&2
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx ufw curl

install -m 0644 "${SCRIPT_DIR}/nginx-pay.med1.uz.conf" /etc/nginx/sites-available/pay.med1.uz
ln -sfn /etc/nginx/sites-available/pay.med1.uz /etc/nginx/sites-enabled/pay.med1.uz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

certbot --nginx --non-interactive --agree-tos --redirect --email "${EMAIL}" -d "${DOMAIN}"
nginx -t
systemctl reload nginx

echo "HTTPS va callbacklar tekshirilmoqda..."
curl --fail --silent --show-error "https://${DOMAIN}/health"
echo
curl --fail --silent --show-error "https://${DOMAIN}/click/prepare"
echo
curl --fail --silent --show-error "https://${DOMAIN}/click/complete"
echo
echo "Tayyor: CLICK kabinetiga https://${DOMAIN}/click/prepare va https://${DOMAIN}/click/complete kiriting."