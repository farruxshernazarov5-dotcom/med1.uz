# MED1.UZ Click va Payme VDS sozlash qo'llanmasi

Ushbu qo'llanma Ubuntu VDS (`89.39.95.5`) da `pay.med1.uz` uchun Nginx reverse
proxy, HTTPS, Click callbacklari va Payme Merchant API endpointini ishga tushiradi.
Maxfiy Click/Payme kalitlari VDS'ga yozilmaydi — ular himoyalangan backendda qoladi.

## Hozirgi muammo nimada?

Jonli tekshiruvda DNS va HTTPS ishlayotgani, ammo VDS'da eski Nginx konfiguratsiyasi
qolgani aniqlandi:

- `https://pay.med1.uz/health` — `200`, lekin eski marker;
- `/click/prepare` va `/click/complete` — `200`;
- `/`, `/payme`, `/click-prepare`, `/click-complete` — `404`.

Demak muammo domen yoki backendda emas. VDS'dagi Nginx faylini yangilash kerak.

## 1. VDS'ga SSH orqali kirish

Windows PowerShell, macOS yoki Linux terminalida:

```bash
ssh root@89.39.95.5
```

Provayder bergan root parolini kiriting. Parolni chatga yoki loyiha fayliga
joylamang.

## 2. Eski Nginx fayllarini topish

VDS ichida quyidagilarni bajaring:

```bash
sudo nginx -T | grep -nE 'server_name pay\.med1\.uz|payme|click/prepare|click/complete'
sudo ls -la /etc/nginx/sites-available/
sudo ls -la /etc/nginx/sites-enabled/
```

Faol fayl odatda quyidagi manzilda bo'ladi:

```text
/etc/nginx/sites-available/pay.med1.uz.conf
```

`sites-enabled` ichida shu faylga bitta symlink bo'lishi kerak. Bir vaqtning o'zida
`pay.med1.uz` va `pay.med1.uz.conf` nomli ikkita faol konfiguratsiya qoldirmang.

## 3. Kerakli paket papkasini kompyuterdan VDS'ga yuborish

Loyihani kompyuteringizga yuklab/clone qilib, loyiha ildizida terminal oching.
Kerakli fayllar:

```text
deploy/click-vps/install.sh
deploy/click-vps/fix-payme-now.sh
deploy/click-vps/nginx-pay.med1.uz.conf
```

Butun papkani yuboring:

```bash
scp -r deploy/click-vps root@89.39.95.5:/root/
```

Keyin VDS'ga qayta kiring:

```bash
ssh root@89.39.95.5
cd /root/click-vps
ls -la
```

## 4. Tavsiya etilgan to'liq o'rnatish

```bash
chmod +x install.sh fix-payme-now.sh
sudo ./install.sh billing@med1.uz
```

Skript quyidagilarni bajaradi:

1. `pay.med1.uz` DNS'i `89.39.95.5` ga qarashini tekshiradi;
2. Nginx, Certbot, UFW va curl o'rnatadi;
3. yagona `pay.med1.uz.conf` faylini faollashtiradi;
4. 80/443 va SSH portlarini ochadi;
5. Let's Encrypt HTTPS sertifikatini o'rnatadi;
6. Click va Payme endpointlarini avtomatik sinaydi.

## 5. Agar to'liq o'rnatish o'tmasa — tezkor 404 tuzatish

DNS va HTTPS oldindan ishlayotgan bo'lsa:

```bash
cd /root/click-vps
sudo EMAIL=billing@med1.uz bash fix-payme-now.sh
```

So'ng konfiguratsiyani tekshiring:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo nginx -T | grep -nE 'server_name pay\.med1\.uz|2026-09-02-v3|payme'
```

`nginx -t` xatosida `conflicting server name` chiqsa, eski dublikatni o'chiring:

```bash
sudo rm -f /etc/nginx/sites-enabled/pay.med1.uz
sudo ln -sfn /etc/nginx/sites-available/pay.med1.uz.conf \
  /etc/nginx/sites-enabled/pay.med1.uz.conf
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Yakuniy tashqi tekshiruv

Istalgan internetga ulangan terminaldan:

```bash
curl -i https://pay.med1.uz/health
curl -I https://pay.med1.uz/
curl -i https://pay.med1.uz/click/prepare
curl -i https://pay.med1.uz/click/complete
curl -i https://pay.med1.uz/click-prepare
curl -i https://pay.med1.uz/click-complete
curl -i -X POST https://pay.med1.uz/payme \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"CheckPerformTransaction","params":{}}'
```

Kutilgan natijalar:

| Manzil | Kutilgan javob |
|---|---|
| `/health` | HTTP `200`, `config: 2026-09-02-v3` |
| `/` | HTTP `302`, `https://med1.uz/payment/success` ga yo'nalish |
| Click to'rtta yo'li | HTTP `200`, JSON javob |
| `/payme` kalitsiz test | HTTP `200`, JSON-RPC xato kodi `-32504` |

Payme uchun `-32504` bu testda **to'g'ri natija**: so'rov Nginx orqali backendga
yetib borgan, lekin ataylab Authorization kalitisiz yuborilgan.

## 7. Click kabinetiga kiritiladigan qiymatlar

```text
Prepare URL: https://pay.med1.uz/click/prepare
Complete URL: https://pay.med1.uz/click/complete
Method: POST
Return URL: https://med1.uz/payment/success
Whitelist / Server IP: 89.39.95.5
```

Eski `/click-prepare` va `/click-complete` yo'llari faqat zaxira alias. Kabinetda
asosiy `/click/prepare` va `/click/complete` manzillaridan foydalaning.

## 8. Payme kabinetiga kiritiladigan qiymatlar

```text
Merchant API endpoint: https://pay.med1.uz/payme
Method: POST
Protocol: JSON-RPC 2.0
Account field: order_id
Account value: platform payment UUID
Currency: UZS (860), amount in tiyin
Whitelist / Server IP: 89.39.95.5
Return URL: https://med1.uz/payment/success
```

Payme maxfiy kalitini Nginx fayliga kiritmang. Payme `Authorization: Basic ...`
sarlavhasini yuboradi, VDS uni o'zgartirmasdan backendga uzatadi.

## 9. Xatoni aniqlash buyruqlari

```bash
sudo journalctl -u nginx --since '30 minutes ago' --no-pager
sudo tail -n 100 /var/log/nginx/access.log
sudo tail -n 100 /var/log/nginx/error.log
sudo ss -lntp | grep -E ':80|:443'
sudo certbot certificates
dig +short pay.med1.uz A
```

- `404 nginx` — eski yoki noto'g'ri server block faol.
- `502 Bad Gateway` — upstream/SNI yoki internet chiqishi muammosi.
- `SSL certificate problem` — Certbot sertifikatini tekshirish kerak.
- Payme `-32504` — endpoint ishlaydi, Authorization kaliti noto'g'ri yoki yo'q.
- Click JSON'da imzo xatosi — Click kabinetidagi Secret Key backenddagi production
  kalit bilan mos emas.

## 10. API orqali integratsiya haqida

Click va Payme integratsiyasi allaqachon API orqali ishlaydi. VDS to'lov biznes
logikasini bajarmaydi; u TAS-IX statik IP va HTTPS reverse proxy vazifasini bajaradi:

```text
Click/Payme -> pay.med1.uz (89.39.95.5) -> himoyalangan payment backend
```

Shuning uchun VDS'ni chetlab yangi alohida API yaratish 404 muammosini hal qilmaydi
va Payme/Click talab qilgan TAS-IX whitelist IP yo'qoladi. To'g'ri yechim — yuqoridagi
Nginx konfiguratsiyasini VDS'ga bir marta to'liq o'rnatish.