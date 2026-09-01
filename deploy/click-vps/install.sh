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
HEALTH="$(curl --fail --silent --show-error "https://${DOMAIN}/health")"
if [[ "${HEALTH}" != *'"config":"2026-09-01-v2"'* ]]; then
  echo "Xato: eski Nginx konfiguratsiyasi ishlayapti: ${HEALTH}" >&2
  exit 1
fi
echo "${HEALTH}"

for PATH_NAME in click/prepare click/complete click-prepare click-complete; do
  BODY="$(curl --fail --silent --show-error "https://${DOMAIN}/${PATH_NAME}")"
  if [[ "${BODY}" != *'"ok":true'* ]]; then
    echo "Xato: /${PATH_NAME} noto'g'ri javob qaytardi: ${BODY}" >&2
    exit 1
  fi
  echo "/${PATH_NAME}: OK"
done

ROOT_STATUS="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "https://${DOMAIN}/")"
if [[ "${ROOT_STATUS}" != "302" ]]; then
  echo "Xato: ${DOMAIN}/ uchun 302 kutilgan, ${ROOT_STATUS} olindi" >&2
  exit 1
fi

echo "Tayyor: CLICK kabinetiga https://${DOMAIN}/click/prepare va https://${DOMAIN}/click/complete kiriting."