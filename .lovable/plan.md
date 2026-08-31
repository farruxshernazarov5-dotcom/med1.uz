# Payme (Paycom) — Endpoint URL va account parametrlarini yakunlash

Payme mutaxassislari ikki narsani so'radi: **Endpoint URL** va **account parameters**. Kod tomondan Merchant API (6 ta metod + fiskal `detail`) allaqachon tayyor, lekin hozirgi holatda beriladigan URL ishlamaydi — uni tuzatib, so'ng rasmiy javob matnini beramiz.

## Hozirgi holat (tekshirildi)

- `https://med1.uz/api/payme` — POST so'roviga **307 redirect** qaytardi, ya'ni Payme JSON-RPC so'rovlari yetib bormaydi. Bu manzilni Payme'ga berish mumkin emas.
- `https://pay.med1.uz/payme` — **404** (nginx konfiguratsiyasida faqat `/click/*` yo'llari bor).
- `pay.med1.uz` (89.39.95.5) — TAS-IX statik IP'li VPS proxy, CLICK uchun ishlayapti; Payme ham xuddi shu kanaldan o'tishi eng to'g'ri yechim.

## Nima qilinadi

1. **VPS nginx konfiguratsiyasiga Payme yo'lini qo'shish**
   - `deploy/click-vps/nginx-pay.med1.uz.conf` fayliga `location = /payme` bloki qo'shiladi (POST/OPTIONS), so'rov `payme-webhook` edge funksiyasiga proxy qilinadi.
   - `Authorization` sarlavhasi o'zgarmasdan uzatiladi (Payme Basic Auth shu yerda tekshiriladi).
   - Qulaylik uchun `/payme/` va `/api/payme` aliaslari ham qo'shiladi.
   - `deploy/click-vps/README.md` ga yangilash bo'yicha buyruqlar yoziladi (siz VPS'da `install.sh` ni qayta ishga tushirasiz yoki konfni nusxalab `nginx -t && systemctl reload nginx`).

2. **Endpoint tekshiruvi**
   - Qayta yuklangandan so'ng `https://pay.med1.uz/payme` ga kalitsiz POST yuborilib, `-32504` (Insufficient privileges) javobi kelishi tasdiqlanadi — bu Payme uchun to'g'ri signal.

3. **Fiskal ma'lumotlarni yakunlash**
   - `payme_fiscal_items` jadvalidagi MXIK/`package_code`/`vat_percent` qiymatlari tekshiriladi va hujjatga MXIK ro'yxati `tasnif.soliq.uz` havolalari bilan kiritiladi.
   - Xizmat turlari: AI konsultatsiya (Med Coin), SaaS obuna (klinika), reklama (Med1 TOP), shifokor qabuli, laboratoriya.

4. **Hujjatni yangilash (`docs/PAYME_INTEGRATION.md`)**
   - Endpoint jadvali `https://pay.med1.uz/payme` ga o'zgartiriladi.
   - GET (base64 link) va POST forma orqali chek yaratish namunalari, `detail` bilan.
   - Payme'ga yuboriladigan tayyor javob matni (Endpoint + account + MXIK jadvali + TAS-IX IP `89.39.95.5`).

5. **Kalitlar**
   - Kassa yaratilgach `PAYME_MERCHANT_ID` va `PAYME_SECRET_KEY` (hamda test kaliti) xavfsiz shaklda so'raladi va funksiyalar qayta joylanadi.

## Payme'ga yuboriladigan javob (yakuniy ko'rinish)

```text
Endpoint URL (Merchant API, JSON-RPC 2.0, POST):
  https://pay.med1.uz/payme
  (TAS-IX, statik IP: 89.39.95.5, HTTPS)

Account parameters:
  order_id  —  buyurtma identifikatori (UUID), majburiy, matn
  Namuna: {"account": {"order_id": "3f2a...-...-..."}}

Valyuta: UZS (860), summalar tiyinda
Amalga oshirilgan metodlar: CheckPerformTransaction, CreateTransaction,
PerformTransaction, CancelTransaction, CheckTransaction, GetStatement
Fiskalizatsiya: CheckPerformTransaction javobida detail.items[]
(title, price, count, code (MXIK), package_code, vat_percent)
```

## Texnik tafsilotlar

- O'zgaradigan fayllar: `deploy/click-vps/nginx-pay.med1.uz.conf`, `deploy/click-vps/README.md`, `docs/PAYME_INTEGRATION.md`; kerak bo'lsa `payme_fiscal_items` uchun kichik migratsiya.
- Edge funksiyalar (`payme-webhook`, `payme-create-invoice`) allaqachon protokolga mos — kod o'zgarishi kutilmaydi.
- Siz tomondan bitta amal talab qilinadi: VPS'da yangilangan nginx konfini qo'llash.
