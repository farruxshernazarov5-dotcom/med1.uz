# Click to'lov tizimi — production integratsiya

Hozirgi holat (tekshirildi): `click-create-invoice` + `click-webhook` edge funksiyalari bor, MD5 imzo, sign_time freshness, rate-limit, replay himoyasi va `click_webhook_log` jadvali ishlaydi. `platform_payments` jadvali to'lovni `paid` holatiga o'tkazadi, **lekin to'lovdan keyin hech narsa bermaydi** — Med Coin qo'shilmaydi, obuna faollashmaydi, invoice yaratilmaydi, Telegram xabar ketmaydi. Click sozlamalari va monitoring uchun Super Admin bo'limi ham yo'q.

Reja shu bo'shliqlarni to'ldiradi va mavjud tizimni buzmaydi.

## 1. Ma'lumotlar bazasi

Yangi jadvallar:
- `payment_packages` — sotiladigan mahsulotlar katalogi (turi: `med_coin` yoki `subscription`, narx, Med Coin miqdori, bonus, obuna tarifi/muddati, faol/nofaol). Miqdorlar kodga yozilmaydi, shu jadvaldan olinadi. Boshlang'ich yozuvlar: 15 000 → 40 coin, 60 000 → 150 coin, 120 000 → 350 coin, hamda LITE / STANDARD / PREMIUM 30 kunlik obunalar.
- `med_coin_ledger` — har bir balans o'zgarishi: user, payment, tur (PURCHASE / USAGE / REFUND / BONUS / ADMIN_ADJUSTMENT), miqdor, balance_before, balance_after, manba, sana.
- `payment_invoices` — invoice raqami (INV-YYYY-NNNNN), payment, Click transaction ID, mahsulot, summa, valyuta, status, Med Coin miqdori.
- `payment_refunds` — payment, sabab, summa, admin, sana, status.

Mavjud jadvallarni kengaytirish:
- `platform_payments`: `package_id`, `status` ro'yxatiga `prepared` va `completed` qo'shish, `(provider, provider_transaction_id)` bo'yicha unique index (idempotentlik).
- `click_webhook_log` allaqachon bor — o'zgartirilmaydi.

Barcha yangi jadvallarga GRANT + RLS: foydalanuvchi faqat o'zinikini ko'radi, admin hammasini, yozish faqat service_role (edge funksiyalar) orqali.

Med Coin berish/qaytarish atomik `credit_purchase_apply(payment_id)` DB funksiyasi orqali bo'ladi: `user_credits` ga yozadi, `credit_history` va `med_coin_ledger` ga yozuv qo'shadi, invoice yaratadi — hammasi bitta tranzaksiyada, payment allaqachon fulfilled bo'lsa hech narsa qilmaydi.

## 2. Backend endpointlar

Click alohida Prepare va Complete URL talab qilgani uchun ikkita yangi funksiya:

| Maqsad | URL |
|---|---|
| Prepare | `https://med1.uz/api/click/prepare` |
| Complete | `https://med1.uz/api/click/complete` |

Bular Vite/hosting rewrite orqali `click-prepare` va `click-complete` edge funksiyalariga yo'naltiriladi (agar rewrite ishlamasa, Click panelga to'g'ridan-to'g'ri funksiya URL'i beriladi va admin panelda aynan ishlaydigan URL ko'rsatiladi — placeholder qoldirilmaydi).

Mavjud `click-webhook` o'chirilmaydi — ichki mantiq umumiy `_shared/click.ts` modulga ko'chiriladi va uchala endpoint ham shundan foydalanadi (dublikat logika bo'lmaydi).

**Prepare** (action=0): imzo, sign_time, service_id, rate-limit, payment mavjudligi, summa DB dagi paket narxiga tengligi, dublikat order tekshiruvi → status `prepared`, `merchant_prepare_id` qaytariladi.

**Complete** (action=1): imzo va barcha yuqoridagi tekshiruvlar + `merchant_prepare_id` mosligi + `click_trans_id` bo'yicha idempotentlik. Muvaffaqiyat bo'lsa bitta tranzaksiyada: payment → `completed`, Med Coin balansiga qo'shish yoki obunani faollashtirish (`ai_subscriptions`, 30 kun), invoice yaratish, ledger yozuvi, audit log, Telegram xabar (foydalanuvchi + admin). Xato bo'lsa Click protokolining rasmiy error kodlari qaytariladi va hech narsa berilmaydi.

`click-create-invoice` yangilanadi: frontenddan summa emas, `package_id` qabul qiladi; summa DB dan olinadi (fraud himoyasi).

## 3. Frontend

- To'lov sahifasi paketlarni `payment_packages` dan oladi, Click tugmasi `package_id` yuboradi.
- `/payment/success` sahifasi natijani serverdan polling qiladi — "muvaffaqiyatli" deb faqat DB status `completed` bo'lgandagina ko'rsatiladi.
- Profil → To'lovlar: to'lovlar tarixi, Med Coin ledger, obunalar, invoice ro'yxati + PDF yuklab olish (mavjud `src/lib/pdf.ts` va invoice util'lari asosida, bo'sh PDF chiqmasligi tekshiriladi).
- Barcha matnlar va xato xabarlari UZ/RU/EN (mavjud i18n).

## 4. Super Admin — `/admin/payments`

Tab'lar: Overview (analitika), Click Integration (sozlamalar + URL'lar), Transactions, Successful / Failed / Pending, Refunds, Invoices, Med Coin Transactions, Subscription Payments, Callback Logs, Security Logs.

- **Click Integration**: Merchant ID, Merchant User ID, Service ID — maskalangan holda (oxirgi 4 belgi), Secret Key umuman ko'rsatilmaydi, faqat "sozlangan/sozlanmagan" holati. Prepare/Complete URL avtomatik ko'rsatiladi + Copy tugmasi. Oxirgi callback va oxirgi muvaffaqiyatli to'lov vaqti.
- **Test paneli**: Test Connection / Prepare / Complete / Verification / Callback / Invoice / Med Coin / Notification — har biri PASS/FAILED va xato sababi bilan. Testlar sandbox payment yaratib, imzoni real algoritm bo'yicha hisoblab, endpointlarga yuboradi; test yozuvlari `is_test` bilan belgilanadi va real hisobotlarga kirmaydi.
- **Analytics**: bugungi/haftalik/oylik/jami tushum, muvaffaqiyatli va muvaffaqiyatsiz to'lovlar, o'rtacha chek, eng ko'p sotilgan tarif, Med Coin va obuna tushumi — Recharts grafiklari bilan.
- Refund oynasi: admin sabab bilan refund yozadi, tegishli Med Coin/obuna qaytariladi (ledger REFUND yozuvi).

Mavjud `/admin/payment-sandbox` sahifasi yangi bo'limga havola qiladi.

## 5. Secrets va Click paneli

Kerakli secretlar (hammasi allaqachon mavjud): `CLICK_MERCHANT_ID`, `CLICK_MERCHANT_USER_ID`, `CLICK_SERVICE_ID`, `CLICK_SECRET_KEY`, `TELEGRAM_API_KEY`, `TELEGRAM_ADMIN_CHAT_ID`.

Click merchant kabinetiga kiritiladigan URL'lar (skrinshotdagi maydonlar):
- Prepare URL → `https://med1.uz/api/click/prepare`
- Complete URL → `https://med1.uz/api/click/complete`

## 6. Yakunda beriladigan hisobot

Ish tugagach: yaratilgan endpointlar ro'yxati, aniq Prepare/Complete URL, kerakli secretlar, Click paneliga kiritish yo'riqnomasi, test panel natijalari va Click tomonidan tasdiq talab qiladigan qismlar ko'rsatiladi.
