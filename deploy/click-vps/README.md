# MED1.UZ to'lov TAS-IX proxy (CLICK + Payme)

Bu paket `89.39.95.5` VPS'ni CLICK Prepare/Complete callbacklari va Payme (Paycom) Merchant API endpointi uchun HTTPS reverse proxy qiladi. Secret Key VPS'ga yozilmaydi; imzo tekshiruvi backend funksiyasida qoladi.

## 1. DNS

DNS boshqaruvida quyidagi yozuvni yarating:

```text
Type: A
Name: pay
Value: 89.39.95.5
TTL: 300
Proxy/CDN: o'chirilgan (DNS only)
```

`dig +short pay.med1.uz A` bu IP'ni qaytargach davom eting.

## 2. VPS'da o'rnatish

Ushbu papkani VPS'ga yuboring va serverda bajaring:

```bash
chmod +x install.sh
sudo ./install.sh billing@med1.uz
```

Skript Nginx, firewall va Let's Encrypt sertifikatini sozlaydi. SSH porti yopilmaydi.
Skript yakunda joriy konfiguratsiya versiyasini, root redirectni va barcha to'rtta
CLICK callback yo'lini tekshiradi; ulardan biri eski bo'lsa muvaffaqiyatli tugamaydi.

## 3. CLICK kabineti

```text
Prepare URL: https://pay.med1.uz/click/prepare
Complete URL: https://pay.med1.uz/click/complete
Method: POST
Return URL: https://med1.uz/payment/success
Whitelist IP: 89.39.95.5
```

## 3b. Payme (Paycom) kabineti

```text
Endpoint (Merchant API): https://pay.med1.uz/payme
Method: POST (JSON-RPC 2.0)
Account parameter: order_id (UUID)
Valyuta: UZS (860), tiyinda
Whitelist IP: 89.39.95.5
```

Aliaslar: `https://pay.med1.uz/payme/` va `https://pay.med1.uz/api/payme` ham
xuddi shu funksiyaga boradi.

## 4. Tekshirish

```bash
curl -i https://pay.med1.uz/health
curl -i https://pay.med1.uz/click/prepare
curl -i https://pay.med1.uz/click/complete
curl -i https://pay.med1.uz/click-prepare
curl -i https://pay.med1.uz/click-complete
curl -i -X POST https://pay.med1.uz/payme -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"CheckPerformTransaction","params":{}}'
sudo nginx -t
sudo journalctl -u nginx --since "10 minutes ago"
```

GET readiness javoblari `200` bo'lishi kerak. Haqiqiy POST imzosi va to'lov zanjiri Super Admin → To'lov testi orqali tekshiriladi.

`pay.med1.uz` bosh sahifasining 404 qaytarishi eski Nginx konfiguratsiyasi hali serverga qo'llanganini bildiradi. `sudo ./install.sh billing@med1.uz` ni qayta ishga tushirgach bosh sahifa `https://med1.uz/payment/success` ga yo'naladi va eski `/click-prepare`, `/click-complete` aliaslari ham ishlaydi.

Joriy server holatini aniq ajratish uchun `/health` javobida
`"config":"2026-09-01-v2"` bo'lishi shart. Bu marker yo'q bo'lsa repodagi yangi
konfiguratsiya VPS'ga hali o'rnatilmagan.

## 5. Payme yo'lini qo'shgandan keyin

Yangi `nginx-pay.med1.uz.conf` faylni VPS'ga nusxalab:

```bash
sudo cp nginx-pay.med1.uz.conf /etc/nginx/sites-available/pay.med1.uz
sudo nginx -t && sudo systemctl reload nginx
```

yoki `sudo ./install.sh billing@med1.uz` ni qayta ishga tushiring.

Kalitsiz POST so'rovga `{"error":{"code":-32504,...}}` javobi kelsa — endpoint
to'g'ri ishlayapti va Payme'ga berishga tayyor.
