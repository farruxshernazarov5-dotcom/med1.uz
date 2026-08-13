# 6. Sandbox va testlash

## 6.1. Sandbox muhiti

Sandbox alohida domenda emas — bir xil Base URL, faqat kalit prefiksi farq qiladi (`md1_sandbox_`). Barcha javoblarda `"sandbox": true` maydoni bo'ladi.

Xususiyatlari:

- Deterministik mock ma'lumot (har safar bir xil natija).
- Real to'lov amalga oshmaydi, Med Coin yechilmaydi.
- AI javoblari qisqartirilgan namuna matn qaytaradi.
- Webhook'lar real yuboriladi — integratsiyani to'liq test qilish mumkin.

## 6.2. Test ma'lumotlari

| Obyekt | Sandbox qiymati |
| --- | --- |
| Klinika ID | 00000000-0000-0000-0000-000000000101 |
| Shifokor ID | 00000000-0000-0000-0000-000000000201 |
| Bemor telefoni | +998901234567 |
| Parol | sandbox123 |
| Band slot (409 test) | 2026-09-01 09:00 |
| To'lov muvaffaqiyatli | amount = 10000 |
| To'lov rad etilgan | amount = 6660 |

## 6.3. Postman

Kolleksiya: https://med1.uz/docs/med1-postman-collection.json

Import qilgach `{{base_url}}` va `{{api_key}}` o'zgaruvchilarini to'ldiring.

## 6.4. Majburiy test ssenariylari (go-live oldidan)

1. `/v1/ping` — kalit va tarmoq ulanishi.
2. Katalog: klinikalar va shifokorlar ro'yxati, pagination.
3. Slotlarni olish va qabul yaratish, so'ng bekor qilish.
4. 409 (band slot) va 422 (noto'g'ri telefon) xatolarini qayta ishlash.
5. 429 holatida backoff mexanizmi.
6. AI so'rov: muvaffaqiyatli javob va 402 (balans yetmasligi).
7. Webhook: imzo tekshiruvi, takroriy hodisani e'tiborsiz qoldirish.
8. Token muddati tugashi va refresh oqimi.
9. Kalit rotatsiyasi — eski va yangi kalit bilan ishlash.
10. To'liq log va `request_id` saqlanishi.

## 6.5. Yuklama testi

Production kaliti berilgunga qadar yuklama (load) testi faqat sandbox'da va oldindan kelishilgan holda o'tkaziladi. Kelishuvsiz yuklama testi kalitni avtomatik bloklashga olib keladi.
