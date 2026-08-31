# MED1.UZ — Payme (Paycom) Merchant API integratsiyasi

Ushbu hujjat MED1.UZ platformasining Payme to'lov tizimi bilan integratsiyasini
to'liq tavsiflaydi va Payme texnik jamoasiga taqdim etish uchun mo'ljallangan.

- Merchant nomi: **MED1.UZ (MED-ALL AI SYSTEM MCHJ)**
- Sayt: https://med1.uz
- Protokol: **Merchant API (JSON-RPC 2.0)**
- Valyuta: **UZS (860)**, summalar **tiyin**da

---

## 1. Endpoint (Merchant API URL)

| Muhit | URL |
|---|---|
| Live | `https://pay.med1.uz/payme` (TAS-IX, statik IP **89.39.95.5**) |
| Test (sandbox) | shu URL, `PAYME_SECRET_KEY_TEST` kaliti bilan |

Bu manzil TAS-IX tarmog'idagi statik IP'li (89.39.95.5) HTTPS reverse proxy bo'lib,
so'rovni o'zgartirmasdan `payme-webhook` backend funksiyasiga uzatadi
(`Authorization` sarlavhasi ham to'liq saqlanadi).

Metod: `POST`, `Content-Type: application/json`.


### Autorizatsiya

```
Authorization: Basic base64("Paycom:<KEY>")
```

Server ham **live**, ham **test** kalitini qabul qiladi:
`PAYME_SECRET_KEY`, `PAYME_SECRET_KEY_TEST`.

Kalit noto'g'ri bo'lsa `-32504` (Insufficient privileges) qaytadi.

---

## 2. Buyurtma identifikatori (account)

```json
"account": { "order_id": "<UUID>" }
```

`order_id` — `platform_payments.id` (UUID). Muqobil kalitlar ham qabul qilinadi:
`payment_id`, `order`.

---

## 3. Amalga oshirilgan metodlar

| Metod | Holat |
|---|---|
| CheckPerformTransaction | ✅ (fiskal `detail` bilan) |
| CreateTransaction | ✅ (idempotent, 12 soatlik timeout) |
| PerformTransaction | ✅ (atomar, takroriy so'rovga bir xil javob) |
| CancelTransaction | ✅ (state −1 / −2) |
| CheckTransaction | ✅ |
| GetStatement | ✅ |

### Xato kodlari

| Kod | Ma'nosi |
|---|---|
| −32700 | JSON parse xatosi |
| −32600 | Noto'g'ri RPC so'rov |
| −32601 | Metod topilmadi |
| −32602 | Noto'g'ri parametrlar |
| −32504 | Autorizatsiya xatosi |
| −31001 | Summa noto'g'ri |
| −31003 | Tranzaksiya topilmadi |
| −31007 | Bekor qilib bo'lmaydi |
| −31008 | Amalni bajarib bo'lmaydi (holat/timeout) |
| −31050 | Buyurtma topilmadi |
| −31051 | Buyurtma to'lov uchun mavjud emas |

### Tranzaksiya holatlari

| state | Ma'nosi |
|---|---|
| 1 | Yaratildi (kutilmoqda) |
| 2 | To'landi |
| −1 | Yaratilgandan keyin bekor qilindi |
| −2 | To'langandan keyin bekor qilindi (qaytarish) |

12 soat ichida `PerformTransaction` kelmasa, tranzaksiya `reason = 4` bilan
avtomatik bekor qilinadi.

---

## 4. Fiskalizatsiya (soliq oboroti)

`CheckPerformTransaction` javobida `detail` obyekti qaytariladi:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "allow": true,
    "detail": {
      "receipt_type": 0,
      "items": [
        {
          "title": "MED1.UZ sun'iy intellekt xizmati obunasi",
          "price": 5000000,
          "count": 1,
          "code": "10305001001000000",
          "package_code": "1471385",
          "vat_percent": 12
        }
      ]
    }
  }
}
```

| Maydon | Izoh |
|---|---|
| `title` | Mahsulot / xizmat nomi |
| `price` | Birlik narxi, **tiyin**da |
| `count` | Soni |
| `code` | **MXIK** kodi |
| `package_code` | O'lchov birligi kodi (MXIK'ga bog'liq) |
| `vat_percent` | QQS foizi |

MXIK va o'lchov birligi mosligini tekshirish:
`https://tasnif.soliq.uz/attribute/<MXIK>`

Fiskal ma'lumotlar `payme_fiscal_items` jadvalida xizmat turi (`purpose`) bo'yicha
saqlanadi va Super Admin panelidan boshqariladi:

| purpose | title | MXIK | package_code | QQS |
|---|---|---|---|---|
| ai_subscription | AI xizmati obunasi | 10305001001000000 | 1471385 | 12 |
| med_coin | Med Coin (elektron xizmat birligi) | 10305001001000000 | 1471385 | 12 |
| saas_subscription | HMS dasturiy ta'minot obunasi | 10305001001000000 | 1471385 | 12 |
| med1_top_ad | MED1 TOP reklama xizmati | 10306001001000000 | 1471385 | 12 |
| clinic_service | Tibbiy xizmat uchun to'lov | 10307001001000000 | 1471385 | 0 |

> Eslatma: MXIK kodlari Payme/Soliq tomonidan tasdiqlangach yakuniy qiymatlarga
> yangilanadi — jadval orqali kod o'zgartirmasdan tahrirlanadi.

---

## 5. Chek yaratish (REDIRECT)

Edge funksiya: `payme-create-invoice` — invoice yaratadi va ikkala usulni qaytaradi.

### GET usuli

```
https://checkout.paycom.uz/<base64(
  m=<MERCHANT_ID>;ac.order_id=<UUID>;a=<TIYIN>;l=uz;c=<RETURN_URL>;ct=15000;cr=UZS;d=<base64(detail)>
)>
```

### POST usuli

```html
<form method="POST" action="https://checkout.paycom.uz">
  <input type="hidden" name="merchant" value="<MERCHANT_ID>">
  <input type="hidden" name="amount" value="<TIYIN>">
  <input type="hidden" name="account[order_id]" value="<UUID>">
  <input type="hidden" name="lang" value="uz">
  <input type="hidden" name="currency" value="860">
  <input type="hidden" name="callback" value="https://med1.uz/payment/success?payment_id=<UUID>&provider=payme">
  <input type="hidden" name="callback_timeout" value="15000">
  <input type="hidden" name="description" value="<xizmat nomi>">
  <input type="hidden" name="detail" value="<base64(detail)>">
</form>
```

Sandbox uchun `action` = `https://test.paycom.uz`.

---

## 6. To'lov oqimi

```text
Mijoz → payme-create-invoice → checkout.paycom.uz
        ↓
Payme  → CheckPerformTransaction  (allow + fiskal detail)
       → CreateTransaction        (state 1, order band qilinadi)
       → PerformTransaction       (state 2, platform_payments.status = paid)
        ↓
Mijoz → https://med1.uz/payment/success?payment_id=...&provider=payme
```

Bekor qilish: `CancelTransaction` → `cancelled` (state −1) yoki `refunded` (state −2).

---

## 7. Loglar va monitoring

Har bir kiruvchi so'rov va chiquvchi javob `payme_webhook_log` jadvaliga
yoziladi: `method`, `rpc_id`, `payment_id`, `payme_transaction_id`,
`request_ip`, `request_body`, `response_body`, `status`, `error_note`.
Loglarni faqat Super Admin ko'ra oladi.

---

## 8. Talab qilinadigan maxfiy kalitlar

| Nomi | Izoh |
|---|---|
| `PAYME_MERCHANT_ID` | Live merchant ID (kassa ID) |
| `PAYME_SECRET_KEY` | Live X-Auth kaliti |
| `PAYME_MERCHANT_ID_SANDBOX` | Test merchant ID (ixtiyoriy) |
| `PAYME_SECRET_KEY_TEST` | Test X-Auth kaliti |

---

## 9. Payme kabinetida sozlanadigan qiymatlar

| Maydon | Qiymat |
|---|---|
| Endpoint (Merchant API URL) | `https://pay.med1.uz/payme` |
| Server IP (TAS-IX, whitelist) | `89.39.95.5` |
| Buyurtma maydoni (account) | `order_id` — UUID, majburiy, matn |
| Valyuta | UZS (860), summalar tiyinda |
| Return / callback URL | `https://med1.uz/payment/success` |

### Payme jamoasiga yuboriladigan matn

```text
Endpoint URL (Merchant API, JSON-RPC 2.0, POST):
  https://pay.med1.uz/payme
  Server: TAS-IX, statik IP 89.39.95.5, HTTPS (Let's Encrypt)

Account parameters:
  order_id — buyurtma identifikatori (UUID, matn, majburiy)
  Namuna: {"account": {"order_id": "3f2a1c4e-8b52-4a1d-9f77-6d0b1c2e3a45"}}

Valyuta: UZS (860), summalar tiyinda.
Amalga oshirilgan metodlar: CheckPerformTransaction, CreateTransaction,
PerformTransaction, CancelTransaction, CheckTransaction, GetStatement.
Fiskalizatsiya: CheckPerformTransaction javobida detail.items[] —
title, price (tiyin), count, code (MXIK), package_code, vat_percent.
Chek yaratish: GET (base64 link) va POST forma — ikkalasi ham qo'llab-quvvatlanadi.
Kompaniya: MED-ALL AI SYSTEM MCHJ (MED1.UZ), sayt: https://med1.uz
```

| Fiskalizatsiya | Yoqilgan (`detail` CheckPerformTransaction javobida) |
