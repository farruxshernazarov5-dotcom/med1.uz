# Mobil ilovada barcha xizmatlar katalogi

## Natija
- Pastki menyudagi **Xizmatlar** bo‘limi avval to‘liq, toifalangan mobil katalogni ochadi; yaqin xizmatlar xaritasi, shifokor qidiruvi va sevimlilar shu markaz ichida alohida ko‘rinish sifatida saqlanadi.
- Katalog saytdagi barcha so‘ralgan bo‘limlarni qamrab oladi: tibbiy muassasalar, 23 ta AI, ensiklopediya va dorilar, ilmiy nashrlar va tekshiruv, ro‘yxatdan o‘tish, Med1 TOP, hamkorlik va rolga mos kabinetlar.
- Mobil bosh sahifada yettita asosiy xizmat uchun tezkor bloklar va “Barcha xizmatlar” tugmasi ko‘rinadi.
- Birinchi mobil tashrifda menyu, AI markazi, xizmatlar katalogi va guruhlar bo‘yicha qisqa yo‘riqnoma chiqadi; uni keyinchalik yordam tugmasidan qayta ochish mumkin.

## Amalga oshirish
1. **Yagona xizmatlar ma’lumotlari**
   - Xizmat nomi, tavsifi, ichki manzili, toifasi, ikonka va rang rolini bitta mobil katalog manbasida saqlash.
   - 23 ta AI xizmat ro‘yxatini shu manbadan AI oynasi va katalogda qayta ishlatib, havolalar orasidagi tafovutni oldini olish.
   - Kabinet havolasini foydalanuvchining roliga mos aniqlash; tizimga kirmagan foydalanuvchini kirish sahifasiga olib borish.

2. **“Barcha xizmatlar” katalogi**
   - Xizmatlar sahifasiga katalogni asosiy ko‘rinish sifatida qo‘shish; qidiruv, gorizontal toifa filtrlari va natijalar sonini ko‘rsatish.
   - Guruhlarni kreativ, lekin ixcham mobil bloklarda berish: “Yaqin tibbiy yordam”, “Med1 AI”, “Bilim va dorilar”, “Nashr va tekshiruv”, “Biznes va reklama”, “Kabinetlar”.
   - Qidiruv yuklanishi, bo‘sh natija, qidiruvni tozalash va tavsiya etilgan xizmatlar holatlarini qo‘shish.
   - Mavjud xarita, shifokor qidiruvi va sevimlilarni katalog tepasidagi tezkor boshqaruvlardan ochish.

3. **Mobil bosh sahifa tezkor bloklari**
   - Faqat mobil ekranda Shifokor, Klinika, Dorixona, Diagnostika, Qon banki, Tug‘ruqxona va Stomatologiya bloklarini ko‘rsatish.
   - Har bir blokni amaldagi sahifasiga, “Barcha xizmatlar” tugmasini yangi katalog ko‘rinishiga ulash.
   - Bloklarni bosh sahifaning birinchi ekranidan keyingi qismida, pastki menyuni to‘smasdan joylashtirish.

4. **Onboarding va vizual uslub**
   - Mobil qobiq ichida safe-area’ga mos, ekran o‘quvchi va klaviatura bilan boshqariladigan qisqa yo‘riqnoma yaratish.
   - Birinchi tashrif holatini faqat yo‘riqnoma ko‘rilganini belgilash uchun qurilmada saqlash; tibbiy yoki profil ma’lumotlarini saqlamaslik.
   - Mavjud Med1 semantik ranglari, ikonkalari, yengil fon naqshi va mazmunli animatsiyalardan foydalanish; kamaytirilgan animatsiya sozlamasini hurmat qilish.

5. **Tekshiruv**
   - Katalogdagi har bir ichki havolani routerdagi haqiqiy sahifa bilan solishtirish va bosib ochilishini avtomatik tekshirish.
   - 384×844 ekranda qidiruv, toifalar, tezkor bloklar, onboarding, xarita/shifokor/sevimlilar o‘tishlarini tekshirish.
   - 1280px ekranda yangi mobil elementlar desktop sahifaga xalaqit bermasligini tasdiqlash.
   - Loyiha yig‘ilishi va brauzer xatolari yo‘qligini tekshirish.

## Texnik tafsilotlar
- Yangi mobil qismlar `src/components/mobile/*`da qoladi; `MobileServicesPage` katalog, xarita, shifokor va sevimlilar ko‘rinishlarini URL parametri orqali boshqaradi.
- Xizmat katalogi statik ichki route ma’lumotidir; yangi backend jadvali yoki maxfiy kesh talab qilinmaydi.
- Barcha tugmalar mavjud dizayn komponentlaridan, ranglar esa faqat semantik tokenlardan foydalanadi.
- Native tebranish dinamik import orqali ishlaydi va web’da xavfsiz no-op bo‘lib qoladi.