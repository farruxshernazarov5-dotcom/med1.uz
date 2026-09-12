# Bemor AI markazi va jonli yordam

## Natija
- Bemor panelida barcha mavjud AI xizmatlarini bir joyga jamlaydigan, mobil va kompyuterga mos “AI xizmatlari” menyusi ochiladi.
- HAMBI × Med1 hamkorligini ifodalovchi zamonaviy belgi va qisqa qulayliklar taqdimoti qo‘shiladi.
- “Qo‘llab-quvvatlash” bo‘limida bemor Med1 operatori bilan sayt ichida real vaqtda yozishadi.
- Super admin panelida operator yangi murojaatlarni ko‘radi, suhbatni ochadi va javob yuboradi.

## Amalga oshirish
1. **AI xizmatlari markazi**
   - Bemor menyusidagi hozirgi bitta AI yordamchini to‘liq AI xizmatlari markaziga aylantirish.
   - Amaldagi barcha asosiy, ixtisoslashgan va radiologiya AI sahifalarini shu yerdan ochish.
   - Tarif/Med Coin holati va tibbiy ogohlantirishni saqlash.
2. **HAMBI × Med1 ko‘rinishi**
   - Ikki xizmat hamkorligini anglatadigan alohida, original belgi yaratish.
   - Tezkor AI tahlili, yagona sog‘liq profili, xavfsiz natijalar va 24/7 yordam afzalliklarini qisqa ko‘rsatish.
3. **Jonli operator chati**
   - Har bir bemorga tegishli suhbat va xabarlarni xavfsiz saqlash.
   - Bemor faqat o‘z yozishmalarini ko‘radi; administrator barcha murojaatlarni boshqaradi.
   - Yangi xabarlar sahifani yangilamasdan paydo bo‘ladi, o‘qilgan/yopilgan holatlari ko‘rsatiladi.
4. **Moslashuvchanlik va tekshiruv**
   - 384px mobil va keng ekranlarda menyu, kartalar va chatni tekshirish.
   - Bemor va admin oqimlari, yuborish va real vaqt yangilanishini sinash.

## Texnik tafsilotlar
- Lovable Cloud bazasida RLS bilan `support_conversations` va `support_messages` jadvallari yaratiladi.
- Rol tekshiruvi mavjud server-side `has_role` funksiyasi orqali bajariladi.
- Chat yangilanishlari Lovable Cloud real-time kanali orqali keladi.
- Mavjud dizayn tokenlari va panel tuzilmasi saqlanadi; yangi ko‘rinish alohida qayta ishlatiladigan qismlarda quriladi.
