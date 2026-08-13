# 10. Production'ga chiqish (Go-Live) nazorat ro'yxati

## 10.1. Yuridik

- [ ] Hamkorlik shartnomasi imzolangan (LGL- raqami mavjud)
- [ ] DPA (ma'lumot qayta ishlash sharti) imzolangan
- [ ] Maxfiylik siyosati, oferta, tibbiy ogohlantirish aksept qilingan
- [ ] Tibbiyot litsenziyasi (agar talab qilinsa) tekshirilgan
- [ ] Bank rekvizitlari va hisob-kitob tartibi kelishilgan

## 10.2. Texnik

- [ ] Sandbox'da 6-bo'limdagi 10 ta ssenariy muvaffaqiyatli o'tgan
- [ ] Production domen(lar) `allowed_domains` ga kiritilgan
- [ ] Server IP'lari `allowed_ips` ga kiritilgan
- [ ] Webhook URL HTTPS va imzo tekshiruvi ishlaydi
- [ ] `x-request-id` yuboriladi va loglanadi
- [ ] 429 uchun backoff, 5xx uchun retry amalga oshirilgan
- [ ] Timeout qiymatlari 5.5-bo'limga muvofiq
- [ ] Kalit secret manager'da, kodda emas
- [ ] Kalit rotatsiyasi jarayoni hujjatlashtirilgan

## 10.3. Mahsulot (UX)

- [ ] AI natijalari yonida tibbiy ogohlantirish ko'rsatiladi
- [ ] Foydalanuvchi roziligi (consent) ekrani mavjud
- [ ] Shoshilinch holat uchun 103 yo'naltirish elementi bor
- [ ] Xatolik holatlari foydalanuvchiga tushunarli tilda ko'rsatiladi
- [ ] UZ / RU / EN tillari qo'llab-quvvatlanadi

## 10.4. Monitoring

- [ ] Xatolik foizi va latency dashboard'i sozlangan
- [ ] Alert kanali (email / Telegram) belgilangan
- [ ] Mas'ul texnik shaxs va navbatchi kontakti berilgan
- [ ] Audit log 90 kun saqlanadi

## 10.5. Ishga tushirishdan keyingi 7 kun

| Kun | Harakat |
| --- | --- |
| 1 | Har soatda xatolik foizi kuzatiladi, limitlar tekshiriladi |
| 2–3 | Webhook yetkazish statistikasi va DLQ tekshiruvi |
| 4–5 | Latency profilingi, kesh strategiyasini sozlash |
| 6–7 | Yakuniy hisobot va limitlarni doimiy rejimga o'tkazish |

## 10.6. Tasdiqlash

Barcha bandlar bajarilgach, Partner Dashboard → Go-Live Request tugmasi orqali so'rov yuboriladi. MED1.UZ texnik jamoasi 3 ish kuni ichida production kalitini faollashtiradi.
