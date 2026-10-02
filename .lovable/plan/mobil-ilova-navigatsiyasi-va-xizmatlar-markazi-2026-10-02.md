# Mobil ilova navigatsiyasi va xizmatlar markazi

## Natija
- Mobil ilovada besh bo‘limli pastki menyu bo‘ladi: Asosiy, Xizmatlar, markaziy Med1 AI, Ensiklopediya va Kabinet.
- Markaziy AI tugmasi asosiy besh AI vositasini ochadigan tortib yopiluvchi pastki oynani chiqaradi.
- Xizmatlar bo‘limi ro‘yxat/xarita rejimi, filtrlar, muassasa kartalari, yo‘nalish va qabulga yozilishni birlashtiradi.
- Joylashuv, bo‘sh natija, shoshilinch xavf va internet holatlari mobil foydalanuvchi uchun aniq boshqariladi.

## Amalga oshirish
1. **Pastki navigatsiya**
   - Mavjud menyuni yangi besh bo‘limga almashtirish; markaziy AI tugmasini gradientli va balandroq joylashtirish.
   - Faol bo‘lim indikatori, haptik javob, safe-area va sahifa pastini to‘smaslikni saqlash.
   - Pastga scroll qilinganda menyuni yashirish, yuqoriga scroll yoki sahifa tepasida qayta ko‘rsatish.
   - Kabinetni bemor profiliga yo‘naltirish; tizimga kirmagan foydalanuvchini kirish sahifasiga olib borish.

2. **Med1 AI pastki oynasi**
   - Rentgen/MRT, laboratoriya OCR, simptom tekshirgich, AI Shifokor va xavf kalkulyatorini mavjud sahifalariga ulash.
   - Fon bosilishi, yopish tugmasi, pastga tortish va telefonning “orqaga” tugmasi bilan yopish.
   - Mavjud AI tahlillari ishga tushganda global “tahlil qilinmoqda” holatini, yakunlanganda “xulosa tayyor” holatini ko‘rsatish va natijaga qaytish.

3. **Xizmatlar va xarita markazi**
   - Mobilga mos yangi Xizmatlar sahifasi: Ro‘yxat/Xarita almashtirgichi va gorizontal filtr chiplari.
   - Klinikalar, shifokorlar, dorixonalar, diagnostika va stomatologiyani mavjud ma’lumot manbalaridan ko‘rsatish.
   - Xarita pinidan 25% mini-karta, undan 75% batafsil muassasa oynasi; yopiq va 24/7 holatlarini ajratish.
   - “Marshrut” va “Qabulga yozilish” amallarini mavjud manzil va qabul sahifalariga ulash.

4. **Maxsus holatlar**
   - GPS berilmasa Toshkent markazini standart qilish va shahar/tuman tanlash oynasini ko‘rsatish.
   - Natija topilmasa radiusni 10 km kengaytirish va filtrlarni tozalash tugmalari.
   - AI xavfi yuqori bo‘lganda 103 chaqiruvi, birinchi yordam qoidalari va 24/7 muassasalar havolasi bilan qizil ogohlantirish.
   - Internet uzilganda sariq banner va oxirgi saqlangan xizmatlar; internet qaytganda yashil tasdiq bildirishnomasi.

5. **Tekshiruv**
   - 384px mobil va 1280px ekranlarda menyu, oynalar, scroll va safe-area holatlarini tekshirish.
   - AI oynasining barcha yopilish usullari, xarita/list almashishi, GPS rad etilishi, bo‘sh natija va offline/online holatlarini sinash.
   - Loyiha yig‘ilishi va brauzer xatolari yo‘qligini tasdiqlash.

## Texnik tafsilotlar
- Mobil qismlar `src/components/mobile/*` ichida saqlanadi; native chaqiruvlar dinamik import va web’da no-op bo‘lib qoladi.
- Pastki oynalar mavjud `vaul` drawer asosida quriladi; yangi ranglar faqat semantik dizayn tokenlari orqali ishlatiladi.
- Xizmatlar keshida qisqa muddatli, maxfiy bo‘lmagan muassasa ro‘yxati saqlanadi; tibbiy tahlil yoki profil ma’lumotlari keshga yozilmaydi.
- Xarita uchun mavjud Leaflet va backenddagi yaqin xizmatlar funksiyasi qayta ishlatiladi; yangi ochiq xarita proksisi yaratilmaydi.
