# Klinika, yaqin xizmatlar va E-IMZO rejasi

## Natija
- Yangi ro‘yxatdan o‘tgan klinika UUID havolasi “Klinika topilmadi” bermaydi; bazadagi ma’lumot, aloqa, xizmatlar, xodimlar va media ko‘rsatiladi.
- Bemorning haqiqiy joylashuvi bo‘yicha MED1 hamkorlari va Google katalogidagi yaqin tibbiy xizmatlar bitta ro‘yxat/xaritada chiqadi.
- Barcha pullik tashkilot obunalarida to‘lovdan oldin tegishli elektron shartnoma majburiy bo‘ladi.
- Shartnoma E-IMZO sertifikati bilan imzolanadi, imzo dalillari va tekshiruv holati PDF/QR tekshiruvda ko‘rinadi.

## Amalga oshirish
1. **Klinika tafsilotlari**
   - Statik katalogdan topilmasa `registered_clinics`dan yuklash.
   - Yuklanish, haqiqiy topilmadi va vaqtinchalik xato holatlarini ajratish.
   - Bazadagi maydonlarni mavjud klinika sahifasiga xavfsiz moslashtirish.

2. **Yaqin tibbiy xizmatlar**
   - Tizimga kirgan foydalanuvchi uchun cheklangan Google Places qidiruv funksiyasi yaratish.
   - Radius, natija soni, so‘rov turi va kirishni tekshirish; bir xil koordinata bo‘yicha qisqa muddatli kesh va takroriy so‘rovlarni kamaytirish.
   - MED1 tashkilotlari va Google katalogi natijalarini takrorlarsiz birlashtirish; Google natijalarini “Google ma’lumoti” deb aniq belgilash.
   - Joylashuv ruxsati rad etilganda Toshkentni “sizning joylashuvingiz” deb ishlatmaslik; aniq xabar va qayta urinish tugmasi ko‘rsatish.
   - Hozirgi Leaflet xaritasida Google’dan olingan koordinatalarni ko‘rsatish. `med1.uz` uchun Google xaritasining o‘zini chizish foydalanuvchining domen-cheklovli Google kaliti ulangach yoqiladi.

3. **E-IMZO shartnomasi**
   - Oddiy OTP + chizilgan imzoni “E-IMZO” deb ko‘rsatishni to‘xtatish.
   - E-IMZO desktop/brauzer klientidan sertifikat tanlash, hujjat xeshini imzolash va serverda imzo/sertifikatni tekshirish oqimini qo‘shish.
   - Sertifikat egasi, seriya raqami, amal muddati, imzolangan vaqt, hujjat xeshi va tekshiruv natijasini auditda saqlash.
   - Standart, o‘zgartirilmagan tarif shartnomalarini admin navbatisiz imzolashga tayyorlash; individual o‘zgartirilgan shartnomalarda admin tasdig‘ini saqlash.
   - E-IMZO mavjud bo‘lmasa aniq o‘rnatish/ishga tushirish ko‘rsatmasini chiqarish; OTP oqimi E-IMZO o‘rniga yuridik teng deb taqdim etilmaydi.

4. **Barcha pullik obunalar**
   - Klinika, diagnostika, shifokor, stomatologiya, dorixona, kosmetologiya, tug‘ruqxona, qon banki va medtexnika tariflarini tegishli shartnoma shabloniga bog‘lash.
   - To‘lov oynasini faqat faol, E-IMZO bilan imzolangan shartnoma mavjud bo‘lsa ochish.
   - To‘lovni yakunlaydigan server oqimida ham shartnoma holatini qayta tekshirish.

5. **Tekshiruv**
   - Muammo bergan klinika havolasi, geolokatsiya ruxsati/inkori, yaqin natijalar va tashqi belgilashni brauzerda tekshirish.
   - E-IMZO klienti mavjud/mavjud emas, sertifikat tanlash, imzolash, noto‘g‘ri imzo va qayta urinish holatlarini tekshirish.
   - Har bir tashkilot roli uchun imzosiz to‘lov bloklanishi va imzodan keyin ochilishini tekshirish.

## Tashqi talablar va cheklovlar
- Google Places qidiruvi foydalanish bo‘yicha haq olishi mumkin; so‘rovlar autentifikatsiya, limit, kesh va radius bilan cheklanadi.
- Hozir ulangan boshqariladigan Google kaliti `*.lovable.app`da ishlaydi, lekin `med1.uz`da Google xaritasini chizmaydi. Custom domen uchun Google Cloud’da billing, Maps JavaScript API/Places API va `https://med1.uz/*`, `https://*.med1.uz/*` referrer ruxsatlari qo‘yilgan shaxsiy kalit kerak.
- E-IMZO ishlab chiqarish tekshiruvi uchun rasmiy E-IMZO klienti/SDKsi va amaldagi sertifikat talab qilinadi; yuridik matn yakuniy ishga tushirishdan oldin O‘zbekiston yuristi tomonidan ko‘rib chiqilishi kerak.
