# VDS (89.39.95.5) — to'lov proxysini noldan sozlash

`pay.med1.uz` — bu sayt emas, faqat to'lov tizimlari (Click, Payme, Uzum) callbacklarini
TAS-IX statik IP orqali backendga uzatuvchi reverse proxy.

Agar VDS'da fayllar buzilgan bo'lsa (`nginx: [emerg] unknown directive`,
`sudo: unable to resolve host`, `Could not resolve host: med1.uz`) — quyidagi
qadamlarni **tartib bilan** bajaring. Hammasi noldan tiklanadi.

---

## 0-qadam. VDS'ga kirish

noVNC konsoli yoki SSH:

```bash
ssh root@89.39.95.5
```

Keyingi barcha buyruqlar `root` sifatida bajariladi.

---

## 1-qadam. hostname va DNS'ni tiklash

`sudo: unable to resolve host vm59104` va `Could not resolve host` xatolarini yo'qotadi:

```bash
echo "127.0.1.1 $(hostname)" >> /etc/hosts
printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' > /etc/resolv.conf
getent ahostsv4 med1.uz
```

Oxirgi buyruq IP qaytarishi kerak. Qaytarmasa, internet/DNS sozlamasini provayder
panelidan tekshiring.

---

## 2-qadam. Buzuq nginx fayllarini tozalash

Skrinshotdagi `pay.med1.uzy`, `pay.med1server` kabi noto'g'ri fayllar shu yerda o'chadi:

```bash
rm -f /etc/nginx/sites-enabled/pay.med1*
rm -f /etc/nginx/sites-available/pay.med1*
rm -f /etc/nginx/conf.d/pay.med1*
rm -f /etc/nginx/sites-enabled/default
find /etc/nginx/sites-enabled -xtype l -delete
nginx -t || true
```

Endi `nginx -t` "unknown directive" bermasligi kerak (boshqa saytlar bo'lsa,
ular haqidagi xatolarni alohida tuzating).

---

## 3-qadam. Nginx va certbot o'rnatish (agar yo'q bo'lsa)

```bash
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx curl
```

---

## 4-qadam. Tiklash skriptini VDS'ga olish

**A varianti — internetdan (loyiha publish qilingan bo'lsa):**

```bash
curl -fsSL https://med1.uz/deploy/fix-payme-now.sh -o /tmp/fix-payme-now.sh
```

**B varianti — qo'lda:**

```bash
nano /tmp/fix-payme-now.sh
```

va loyihadagi `deploy/click-vps/fix-payme-now.sh` faylining **to'liq matnini**
nusxalab qo'ying (Ctrl+O, Enter, Ctrl+X).

**C varianti — kompyuteringizdan `scp` orqali:**

```bash
scp deploy/click-vps/fix-payme-now.sh root@89.39.95.5:/tmp/fix-payme-now.sh
```

---

## 5-qadam. Skriptni ishga tushirish

```bash
sudo EMAIL=billing@med1.uz bash /tmp/fix-payme-now.sh
```

Skript o'zi:
1. hostname va DNS'ni tiklaydi;
2. nginx'ni o'rnatadi (kerak bo'lsa);
3. barcha eski/buzuq `pay.med1*` konfiguratsiyalarni o'chiradi;
4. yagona toza konfiguratsiyani yozadi (marker `2026-09-02-v4`);
5. `nginx -t` + reload, so'ng certbot orqali HTTPS'ni tiklaydi;
6. barcha yo'llarni self-test qiladi.

---

## 6-qadam. Tekshirish

```bash
curl -i https://pay.med1.uz/health
curl -i https://pay.med1.uz/
curl -i https://pay.med1.uz/click/prepare
curl -i https://pay.med1.uz/click/complete
curl -i https://pay.med1.uz/click-prepare
curl -i https://pay.med1.uz/click-complete
curl -s -X POST https://pay.med1.uz/payme -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"CheckPerformTransaction","params":{}}'
curl -i -X POST https://pay.med1.uz/uzum -H 'Content-Type: application/json' -d '{}'
```

Kutilgan natijalar:

| Yo'l | Kutilgan |
|---|---|
| `/health` | 200 va `"config":"2026-09-02-v4"` |
| `/` | 302 → `https://med1.uz/payment/success` |
| `/click/prepare`, `/click/complete` | 200, `"ok":true` |
| `/click-prepare`, `/click-complete` | 200 (eski aliaslar) |
| `/payme` | JSON-RPC javob, kalitsiz so'rovda `"code":-32504` |
| `/uzum` | 404 emas (backend javobi) |

`"config":"2026-09-02-v4"` ko'rinmasa — eski konfiguratsiya hali ishlayapti,
2-qadamni qayta bajarib skriptni qaytadan ishga tushiring.

---

## Ochilgan to'lov yo'llari

| Provayder | URL | Backend funksiya |
|---|---|---|
| Click Prepare | `https://pay.med1.uz/click/prepare` | `click-prepare` |
| Click Complete | `https://pay.med1.uz/click/complete` | `click-complete` |
| Click (eski aliaslar) | `/click-prepare`, `/click-complete` | o'sha funksiyalar |
| Click webhook | `https://pay.med1.uz/click/webhook` | `click-webhook` |
| Payme (Paycom) | `https://pay.med1.uz/payme` (`/payme/`, `/api/payme`) | `payme-webhook` |
| Uzum Bank | `https://pay.med1.uz/uzum` (`/uzum/`, `/api/uzum`) | `uzum-webhook` |
| Umumiy webhook | `/payment/webhook`, `/api/payment` | `payment-webhook` |

Kabinetlarga qo'yiladigan qiymatlar:

```text
CLICK  → Prepare: https://pay.med1.uz/click/prepare
         Complete: https://pay.med1.uz/click/complete
         Return: https://med1.uz/payment/success
         Whitelist IP: 89.39.95.5

PAYME  → Endpoint: https://pay.med1.uz/payme
         Method: POST (JSON-RPC 2.0), Login: Paycom
         Account parameter: order_id (UUID)
         Valyuta: UZS (860), tiyinda
         Whitelist IP: 89.39.95.5

UZUM   → Endpoint: https://pay.med1.uz/uzum
         Whitelist IP: 89.39.95.5
```

---

## Tez-tez uchraydigan xatolar

| Xato | Sabab | Yechim |
|---|---|---|
| `unknown directive "/etc/nginx/..."` | Buzuq/noto'g'ri nomlangan konfig fayl | 2-qadam |
| `sudo: unable to resolve host` | hostname `/etc/hosts` da yo'q | 1-qadam |
| `Could not resolve host: med1.uz` | DNS resolver bo'sh | 1-qadam |
| Barcha yo'llarda 404 (`nginx/1.18.0`) | Eski konfiguratsiya faol | 2 + 5-qadam |
| 502 Bad Gateway | SNI/Host sarlavhasi yo'q | Skriptni qayta ishga tushiring |
| `-32504` javobi | To'g'ri: backend Payme avtorizatsiyasini so'rayapti | Harakat kerak emas |

---

## Muhim

- Secret kalitlar (Click Secret Key, Payme kaliti) **VDS'ga yozilmaydi** — imzo
  tekshiruvi faqat backend funksiyalarida bajariladi.
- Sertifikat avtomatik yangilanadi: `systemctl status certbot.timer`.
- Konfiguratsiya versiyasi Super Admin → To'lov testi panelida ham tekshiriladi
  (`proxy:health` qatori marker `2026-09-02-v4` ni kutadi).
