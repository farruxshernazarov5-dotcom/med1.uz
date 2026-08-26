# MED1.UZ CLICK TAS-IX proxy

Bu paket `89.39.95.5` VPS'ni CLICK Prepare/Complete callbacklari uchun HTTPS reverse proxy qiladi. Secret Key VPS'ga yozilmaydi; imzo tekshiruvi backend funksiyasida qoladi.

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

## 3. CLICK kabineti

```text
Prepare URL: https://pay.med1.uz/click/prepare
Complete URL: https://pay.med1.uz/click/complete
Method: POST
Return URL: https://med1.uz/payment/success
Whitelist IP: 89.39.95.5
```

## 4. Tekshirish

```bash
curl -i https://pay.med1.uz/health
curl -i https://pay.med1.uz/click/prepare
curl -i https://pay.med1.uz/click/complete
sudo nginx -t
sudo journalctl -u nginx --since "10 minutes ago"
```

GET readiness javoblari `200` bo'lishi kerak. Haqiqiy POST imzosi va to'lov zanjiri Super Admin → To'lov testi orqali tekshiriladi.