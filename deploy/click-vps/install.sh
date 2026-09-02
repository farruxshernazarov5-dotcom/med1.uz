#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="pay.med1.uz"
EXPECTED_IP="89.39.95.5"
MARKER="2026-09-02-v4"
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

VDS_HOSTNAME="$(hostname)"
if ! grep -Eq "(^|[[:space:]])${VDS_HOSTNAME}([[:space:]]|$)" /etc/hosts; then
  printf '127.0.1.1 %s\n' "${VDS_HOSTNAME}" >> /etc/hosts
fi

CURRENT_IP="$(getent ahostsv4 "${DOMAIN}" | awk 'NR==1 {print $1}')"
if [[ "${CURRENT_IP}" != "${EXPECTED_IP}" ]]; then
  echo "Xato: ${DOMAIN} A-record hozir '${CURRENT_IP:-topilmadi}', '${EXPECTED_IP}' bo'lishi kerak." >&2
  echo "DNS yozuvini yarating, tarqalishini kuting va skriptni qayta ishga tushiring." >&2
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx ufw curl

# Eski va buzuq konfiguratsiyalarni to'liq tozalash.
find /etc/nginx/sites-enabled -maxdepth 1 -name 'pay.med1*' -exec rm -f {} + 2>/dev/null || true
find /etc/nginx/sites-available -maxdepth 1 -name 'pay.med1*' -exec rm -f {} + 2>/dev/null || true
find /etc/nginx/conf.d -maxdepth 1 -name 'pay.med1*' -exec rm -f {} + 2>/dev/null || true
find /etc/nginx/sites-enabled -xtype l -delete 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default

mkdir -p /etc/nginx/snippets
install -m 0644 "${SCRIPT_DIR}/med1-pay-proxy.conf" /etc/nginx/snippets/med1-pay-proxy.conf
install -m 0644 "${SCRIPT_DIR}/nginx-pay.med1.uz.conf" /etc/nginx/sites-available/pay.med1.uz.conf
ln -sfn /etc/nginx/sites-available/pay.med1.uz.conf /etc/nginx/sites-enabled/pay.med1.uz.conf
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
if [[ "${HEALTH}" != *"\"config\":\"${MARKER}\""* ]]; then
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

PAYME_BODY="$(curl --fail --silent --show-error --request POST \
  --header 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"CheckPerformTransaction","params":{}}' \
  "https://${DOMAIN}/payme")"
if [[ "${PAYME_BODY}" != *'"code":-32504'* ]]; then
  echo "Xato: /payme backendga yetib bormadi: ${PAYME_BODY}" >&2
  exit 1
fi
echo "/payme: OK (backend avtorizatsiya javobi olindi)"

UZUM_STATUS="$(curl --silent --output /dev/null --write-out '%{http_code}' --request POST \
  --header 'Content-Type: application/json' --data '{}' "https://${DOMAIN}/uzum")"
if [[ "${UZUM_STATUS}" == "404" ]]; then
  echo "Xato: /uzum proxy yo'li ishlamayapti (404)" >&2
  exit 1
fi
echo "/uzum: OK (${UZUM_STATUS})"

ROOT_STATUS="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "https://${DOMAIN}/")"
if [[ "${ROOT_STATUS}" != "302" ]]; then
  echo "Xato: ${DOMAIN}/ uchun 302 kutilgan, ${ROOT_STATUS} olindi" >&2
  exit 1
fi

echo "Tayyor: CLICK, Payme va Uzum callback yo'llari ishlayapti."
