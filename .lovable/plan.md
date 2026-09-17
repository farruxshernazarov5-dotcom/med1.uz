# Med Coin va obuna tizimini yakunlash

## 1. Payme → Med Coin yetkazib berishni tasdiqlash
- To'lov o'tgach kabinetdagi balans darhol yangilanadi: to'lov muvaffaqiyatli bo'lganda hamyon va balans qayta o'qiladi (hozir faqat sahifa yangilanganda ko'rinadi).
- Payme test to'lovi orqali tekshiriladi: to'lov → coin berildi → balans o'zgardi → chek yaratildi.
- Agar coin berilmasa, kabinetda "Xizmatni olish" tugmasi allaqachon bor; unga xatolik sababi ham ko'rsatiladi.

## 2. Super admin: Med Coin nazorat sahifasi
Yangi alohida sahifa `/admin/med-coin` (mavjud Payme/super admin bo'limlariga tegmasdan):
- **Umumiy hisob**: jami sotilgan coin, ishlatilgan coin, aylanmadagi qoldiq, muddati o'tgan coin, pul aylanmasi.
- **To'lov jarayoni**: har bir to'lov — kim, qaysi paket, summa, provayder, holati (kutilmoqda / to'landi / yetkazildi / qaytarildi), yetkazilmagan to'lovlarni bir bosishda yetkazish.
- **Paketlar**: paket qo'shish/tahrirlash/o'chirish (nomi, narxi, coin, bonus, muddat, faol/nofaol) — narx va coin darhol saytda aks etadi.
- **Foydalanuvchi bo'yicha hisob**: qidiruv, balans, tarix, qo'lda coin berish/olib qo'yish (sabab bilan, audit logga yoziladi).

## 3. Klinika (muassasa) Med Coin hisobi
- Muassasa uchun alohida coin hisobi: to'lov qilganda coin shaxsiy emas, tanlangan muassasa hisobiga tushadi.
- To'lov oynasida "Qaysi muassasa uchun?" tanlovi — foydalanuvchining muassasalari ro'yxatidan; tanlov saqlanadi va keyingi safar eslab qolinadi.
- Shartnoma bo'yicha hisoblash: muassasa hisobidagi sarf shartnomaga bog'lanadi, oylik hisobot va qoldiq shartnoma raqami bilan ko'rsatiladi.
- Dashboardda "Muassasa Med Coin hisobi" bloki: qoldiq, sarf tarixi, xodimlar bo'yicha sarf.

## 4. Obuna tizimi (to'liq oqim)
- Paket tanlash → narx/coin hisoblash (bonus, muddat, chegirma) → to'lov → coin berish → obuna faollashtirish → muassasaga biriktirish.
- Obuna faol muddati, avtomatik tugash va eslatma (tugashiga 3 kun qolganda).
- To'lov qaytarilganda: obuna to'xtatiladi, berilgan coin hisobdan yechiladi (agar sarflangan bo'lsa — minus qoldiq emas, qarz sifatida belgilanadi va admin ko'radi).
- Har bir bosqich hisob kitobi ledgerga yoziladi, ikki marta berish bloklanadi.

## 5. Payme kassasi (`/kassa/payme`)
- Obuna to'lovlari ham kassada ko'rinadi: paket nomi, coin miqdori, muassasa, obuna holati.
- Kassadan to'lovni qaytarish — qaytarilganda coin va obuna avtomatik bekor qilinadi.
- Filtrlar: tur (coin / obuna / klinika hisob-fakturasi), holat, sana, muassasa.

## 6. Dashboard tarif ko'rinishi
- Yuqoridagi tarif nomi haqiqiy tarifga mos bo'ladi (Bepul / Lite / Standard / Premium, muassasalar uchun Starter / Pro / Enterprise) — hozir hamma joyda "Bepul" turibdi.
- Har bir tarifga o'z rangi: Bepul — kulrang, Lite — ko'k, Standard — to'q sariq, Premium — binafsha, Enterprise — oltin. Panelning yuqori qismi, nishoncha va urg'u ranglari shu rangga uyg'unlashadi.
- Mobil va desktopda bir xil to'g'ri ko'rinadi.

## Texnik tafsilotlar
- Yangi jadvallar: `org_credit_accounts` (muassasa balansi), `org_credit_ledger` (kirim/chiqim, shartnomaga bog'liq), `subscription_refunds`.
- `fulfill_platform_payment` kengaytiriladi: `metadata.org_id` bo'lsa coin muassasa hisobiga, aks holda foydalanuvchiga; obuna paketida `tenant_subscriptions`/`ai_subscriptions` faollashtiriladi.
- Yangi `refund_platform_payment(uuid, reason)` RPC: idempotent, coin va obunani qaytaradi, ledger + audit yozadi.
- Admin sahifa faqat `has_role(admin)` bilan ochiladi; barcha yozuvlar RLS va service_role orqali.
- Frontend: `useOrgCredits` hook, `MedCoinAdminPage`, kassa filtrlari, `TIER_THEME` patient tariflari bilan kengaytiriladi va `PatientDashboard`/`DashboardShell` o'sha manbadan rang oladi.
