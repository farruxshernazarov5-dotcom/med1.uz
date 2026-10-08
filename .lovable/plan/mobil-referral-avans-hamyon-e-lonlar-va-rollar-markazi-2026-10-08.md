# Mobil referral, avans hamyon, e’lonlar va rollar markazi

## Natija
Mobil ilovada yangi imkoniyatlar mavjud katalog va Profil uslubida ishlaydi:

- Profil ichida **Referral va bonuslar**: shaxsiy kod/havola, statistika, taklif qilinganlar, hamyon, reyting va to‘liq qoidalar.
- Profil ichida **Med ALL avans kartasi**: so‘m balansi, Click/Payme/QR orqali to‘ldirish, kirim-chiqim va xizmat uchun to‘lash.
- Asosiy/Xizmatlar qismida **E’lonlar doskasi**: “Tibbiy xizmatlar” va “Ish, uskuna va hamkorlik” alohida oqimlar.
- Asosiy qismda **10 ta rol markazi**: har rolning vazifasi, imkoniyatlari va mos tariflari.
- Har yangi bo‘lim birinchi kirishda avtomatik 3–4 kadrli foto hikoya ko‘rsatadi; keyin `?` tugmasidan qayta ochiladi.
- Mobil filtrlar uzun bitta qator o‘rniga ikki ustunli moslashuvchan panjara va “Barcha filtrlar” pastki oynasida ishlaydi.

## Joylashuv

```text
Asosiy
├─ Tezkor xizmatlar
├─ E’lonlar doskasi
└─ Rolingizni tanlang (10 rol)

Profil
├─ Referral va bonuslar
├─ Med ALL avans kartasi
└─ To‘lovlar va cheklar

Xizmatlar
└─ Mobilga mos filtrlar
```

Pastki 5 bo‘limli navigatsiya o‘zgarmaydi. Click’dagi kabi yon “Biznes” tugmasi faqat biznesga tegishli qisqa amallarni ochadi; asosiy tibbiy navigatsiyani to‘smasligi va bemor oqimini chalkashtirmasligi kerak.

## Referral
- Mavjud real referral ma’lumotlari va `ReferralPanel` Profilga ulanadi; yangi parallel bonus hisoboti yaratilmaydi.
- Kod yaratish, ulashish, takliflar holati, bonus hamyoni, tier/reytng va referral qoidalari mobil ekran uchun qayta joylanadi.
- Kirilmagan foydalanuvchi referral havolasidan keyin aynan shu bo‘limga qaytadi.
- Qoidalar, firibgarlikka qarshi holatlar va bonus qachon tasdiqlanishi sodda so‘zlar bilan ko‘rsatiladi.

## So‘m avans hamyoni
- Har foydalanuvchiga bitta so‘m hamyoni, o‘zgarmas tranzaksiya jurnali va to‘lov/yechish/qaytarish yozuvlari yaratiladi.
- Click/Payme/QR to‘ldirish mavjud xavfsiz to‘lov oqimlari orqali boshlanadi; balans faqat provayder to‘lovni tasdiqlagach serverda oshadi.
- Xizmat uchun to‘lov faqat haqiqiy invoys/bron identifikatori bilan, yetarli balans bo‘lsa atomik ravishda yechiladi. Ikki marta yechish idempotency kaliti bilan bloklanadi.
- Bekor qilingan xizmat uchun qaytarish faqat tasdiqlangan bekor qilish oqimi orqali hamyonga qaytadi.
- Karta raqami sifatida bank kartasi uydirilmaydi; Med ALL ichki avans kartasi, balansni yashirish, QR to‘ldirish, tarix va chek amallari ko‘rsatiladi.
- Birinchi bosqichda faqat Med1 tizimida haqiqiy invoys yaratadigan xizmatlar balansdan to‘lanadi; tashqi klinikaga pul o‘tkazish hisob-kitob shartnomasisiz yoqilmaydi.

## E’lonlar doskasi
- Ikki tab: **Tibbiy e’lonlar** va **Ish / uskuna / hamkorlik**.
- Qidiruv, hudud, tur, sana va faqat tasdiqlangan e’lonlar filtrlari bo‘ladi.
- Yangi e’lonlar moderatsiyadan o‘tadi; egasi o‘z e’lonlarini boshqaradi.
- Pullik TOP joylar mavjud Med1 TOP tizimidan olinadi va organik ro‘yxatdan alohida “Reklama/Sponsored” blokida ko‘rsatiladi.
- Bo‘sh, yuklanish, xatolik va moderatsiya kutilmoqda holatlari to‘liq beriladi.

## 10 ta rol va tariflar
- Bemor, shifokor, klinika, diagnostika, Medtexnika, tug‘ruqxona, kosmetologiya, dorixona, stomatologiya va qon banki yagona rol katalogidan olinadi.
- Har rol kartasida kim uchunligi, nimalarni boshqarishi, ro‘yxatdan o‘tish manzili va amaldagi tariflari ko‘rsatiladi.
- Rol tanlash ro‘yxatdan o‘tish oqimiga xavfsiz uzatiladi; mavjud foydalanuvchi roli o‘zboshimchalik bilan almashtirilmaydi.
- Har rol uchun 3 ta yangi vertikal kreativ foto yaratiladi; matn rasmga yozilmaydi, ilova ustki qatlamida aniq va tarjima qilinadigan ko‘rinishda turadi.

## Texnik tafsilotlar
- Yangi hamyon jadvallari qat’iy egaga bog‘langan o‘qish siyosati bilan; balansni foydalanuvchi brauzerdan o‘zgartira olmaydi.
- Pul yozuvlari server funksiyalari va to‘lov webhooklari orqali yaratiladi; summa, valyuta, provayder, holat, invoys va idempotency saqlanadi.
- E’lonlar jadvallari egasi yaratishi/tahrirlashi, ommaga faqat tasdiqlangani ko‘rinishi va admin moderatsiyasi qoidalari bilan quriladi.
- Profil menyulari `mobileProfileCatalog.ts`, xizmat/rol/e’lon navigatsiyasi esa mobil katalog manbalaridan boshqariladi.
- Rasmlar loyiha assetlari sifatida saqlanadi; mavjud yuklangan Click tasviri faqat dizayn namunasi bo‘lib qoladi va ilovaga kiritilmaydi.

## Tekshiruv
- Referral kod yaratish, ulashish va statistikani kirgan hisobda tekshirish.
- Hamyonni Click/Payme/QR bilan to‘ldirishning tasdiqlangan va bekor qilingan holatlari; takror webhook va ikki marta yechishni sinash.
- Xizmat invoysini balansdan to‘lash va qaytarish jurnalini tekshirish.
- E’lon yaratish, moderatsiya, ikki tab, Sponsored ajratilishi va bo‘sh/xato holatlarini tekshirish.
- 360–430 px ekranlarda filtrlar, 10 rol kartalari, foto hikoyalar, `?` yordam, klaviatura va ekran o‘quvchi holatlarini tekshirish.
