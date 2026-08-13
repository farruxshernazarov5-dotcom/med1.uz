# 7. Xavfsizlik va ma'lumot himoyasi

## 7.1. Transport va saqlash

| Talab | Minimal daraja |
| --- | --- |
| Transport shifrlash | TLS 1.2+ (TLS 1.3 tavsiya) |
| Saqlashda shifrlash | AES-256 |
| Kalitlarni saqlash | Secret manager / env, repozitoriyda emas |
| Parollar | Argon2 yoki bcrypt (cost >= 12) |
| Sessiya | JWT 1 soat, refresh rotatsiya bilan |

## 7.2. Hamkor majburiyatlari

- API kalitini uchinchi shaxsga bermaslik va mijoz qurilmasiga joylashtirmaslik.
- Loglarda PHI (tibbiy ma'lumot), to'liq telefon, JSHSHIR, kalit yoki token saqlamaslik.
- Ma'lumotni faqat shartnomada ko'rsatilgan maqsadda ishlatish.
- Foydalanuvchidan aniq rozilik (consent) olish va uni jurnalga yozish.
- Xavfsizlik hodisasi (incident) haqida 24 soat ichida security@med1.uz ga xabar berish.
- Kamida 90 kunlik audit log yuritish.

## 7.3. Ma'lumotlarni minimallashtirish

Faqat zarur maydonlarni so'rang. EMR va laboratoriya natijalari faqat bemor JWT'si bilan olinadi va hamkor tomonda kesh qilinmasligi kerak (agar shartnomada alohida ko'rsatilmagan bo'lsa).

| Ma'lumot turi | Saqlash muddati (hamkorda) |
| --- | --- |
| Qabul metadata | 12 oy |
| To'lov metadata | 5 yil (buxgalteriya) |
| EMR / laboratoriya | keshlash taqiqlanadi |
| AI so'rov matni | 30 kun (anonimlashtirilgan) |
| Audit log | 90 kun minimum |

## 7.4. Normativ muvofiqlik

- O'zbekiston Respublikasining «Shaxsga doir ma'lumotlar to'g'risida»gi Qonuni.
- Shaxsiy ma'lumotlarni O'zbekiston hududida saqlash talabi (localization).
- MED1.UZ Maxfiylik siyosati — https://med1.uz/privacy
- Tibbiy ogohlantirish — https://med1.uz/disclaimer
- Cookie siyosati — https://med1.uz/cookie-policy

## 7.5. AI xizmatlaridan foydalanish qoidalari

- AI natijasi tashxis emas — har bir ekranda tibbiy ogohlantirish ko'rsatilishi shart.
- AI javobini shifokor xulosasi sifatida taqdim etish taqiqlanadi.
- Bolalar (18 yoshgacha) uchun AI xizmatlari faqat vasiy roziligi bilan.
- Shoshilinch holatlarda foydalanuvchini 103 raqamiga yo'naltirish elementi majburiy.

## 7.6. Incident response

1. Aniqlash va lokalizatsiya (kalitni darhol revoke qilish).
2. 24 soat ichida MED1.UZ ga rasmiy xabar (vaqt, ta'sir doirasi, request_id'lar).
3. 72 soat ichida dastlabki hisobot.
4. 14 kun ichida yakuniy hisobot va oldini olish chora-tadbirlari.
