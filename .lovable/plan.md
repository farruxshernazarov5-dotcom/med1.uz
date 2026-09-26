# @emedinfobot — Med1.uz bemor va biznes super-boti

## Maqsad
@emedinfobot’ni Med1.uz sayti bilan sinxron ishlaydigan, bemor va biznes foydalanuvchilari uchun bo‘limlarga ajratilgan Telegram bot va Mini App kirish nuqtasiga aylantirish. Eski OTP, xavfsizlik va to‘lov botlari o‘zgarmaydi.

## 1. Hisob ulanishidagi takrorlanish xatosi
- Bir Telegram hisobiga bir nechta Med1.uz profili yoki rol ulangan holatni to‘g‘ri qo‘llab-quvvatlash.
- Telefon raqamini barcha joyda yagona `+998XXXXXXXXX` formatida solishtirish.
- “Ulandi” xabaridan keyin “ulanmagan” chiqishini bartaraf etish.
- Bemor va biznes profili birga topilsa, kabinet tanlash tugmalarini ko‘rsatish.
- Telefon tugmasini hisob allaqachon ulangan bo‘lsa qayta so‘ramaslik.

## 2. Bo‘limli kreativ menyu
- **Shaxsiy:** bemor kabineti, qabullar, tibbiy karta, tahlillar, retseptlar, Med Coin va to‘lovlar.
- **AI salomatlik:** AI shifokor, simptom tekshirish, tahlil/radiologiya, homiladorlik, dietolog, psixolog va boshqa mavjud AI xizmatlar.
- **Tibbiy xizmatlar:** shifokorlar, klinikalar, diagnostika, dorixona, stomatologiya, tug‘ruqxona, qon banki, kosmetologiya va medtexnika.
- **Biznes:** foydalanuvchining haqiqiy roliga mos klinika, shifokor, diagnostika, dorixona, stomatologiya va boshqa boshqaruv kabinetlari; moliya, tahlil, marketing, xodimlar va yuridik markaz shu kabinet ichida ochiladi.
- **Platforma:** biz haqimizda, yutuqlar, hamkorlik, Med1 TOP, yangiliklar, maqolalar, OAV va aloqa.
- **Hujjatlar:** shartnomalar, foydalanish shartlari, maxfiylik, tibbiy ogohlantirish, SaaS shartlari va hujjat verifikatsiyasi.
- Super-admin boshqaruvi bot menyusiga kiritilmaydi.

## 3. Sayt bilan sinxron ishlash
- Har bir tugma mavjud `med1.uz` yo‘lini Telegram Mini App ichida ochadi; funksiyalar qayta yozilmaydi va sayt bilan bir xil ma’lumotlar bazasidan foydalanadi.
- Yangiliklar tugmasi saytning joriy yangiliklar sahifasini real vaqtda ochadi.
- Kanalga avtomatik e’lon uchun alohida, xavfsiz nashr endpointi tayyorlanadi; kanal identifikatori berilgach yangi yangilik/yutuq/shartnoma e’lonlari yuboriladi.
- Bot webhook hodisalari takror yuborilganda xavfsiz va idempotent ishlaydi.

## 4. Bot brendi
- Tayyorlangan kvadrat MED1.UZ bot avatarini Telegram profiliga o‘rnatish.
- Bot nomi, qisqa tavsifi, to‘liq ingliz/o‘zbek tavsifi, buyruqlar va doimiy Med1.uz Mini App tugmasini yangilash.
- `/start`, `/menu`, `/kabinet`, `/patient`, `/business`, `/ai`, `/services`, `/news`, `/docs`, `/about`, `/help` buyruqlarini qo‘shish.

## 5. Tekshiruv
- Takroriy profil holatini bazadagi mavjud real hisob bilan tekshirish.
- Webhook, menyu callbacklari, profil/rol tanlash va hujjat tugmalarini sinash.
- Eski bot funksiyalari va tokenlariga tegilmaganini tekshirish.
- Saytning telefon va Telegram Mini App ko‘rinishlarini tekshirish.

## Texnik tafsilotlar
- Yangi bot faqat `EMEDINFO_BOT_TOKEN`dan foydalanadi; eski `TELEGRAM_BOT_TOKEN`, OTP, xavfsizlik va to‘lov oqimlari o‘zgarishsiz qoladi.
- Bir chatga tegishli profillar ro‘yxat sifatida olinadi; `.maybeSingle()` ishlatilmaydi.
- Rolga mos kabinet yo‘llari serverdagi ruxsatlar asosida tuziladi, foydalanuvchi kiritgan rolga ishonilmaydi.
- Kanalga yuborish faqat serverda saqlanadigan kanal identifikatori va bot huquqlari bilan ishlaydi.
