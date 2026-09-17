# Med Coin, tarif va Click xatolarini tuzatish

## Natija
- 78 Med Coin mavjud foydalanuvchi AI xizmatidan foydalanayotganda kunlik bepul limit bilan bloklanmaydi; so‘rov narxi balansdan belgilangan tartibda yechiladi.
- Bemor panelidagi tarif yozuvi va rangi faol Lite, Standard yoki Premium obunasiga mos keladi; faqat coin paketi xarid qilingan bo‘lsa, balans ko‘rinadi va obuna asossiz ko‘rsatilmaydi.
- Click checkout’dagi “Yetkazib beruvchidan ma’lumot yetarli emas” sababi aniqlanib, checkout parametrlari va Click xizmat sozlamalari moslashtiriladi.
- To‘lovdan keyin balans, tarif va to‘lov holati darhol yangilanadi.

## Amalga oshirish
1. Foydalanuvchining oxirgi Payme/Click to‘lovlari, faol obunasi, 78 coin balansi va bugungi AI sarfini bazadan tekshirish.
2. AI kirish tekshiruvini obuna limiti bilan birga Med Coin balansini ham hisobga oladigan qilish; yetarli coin bo‘lsa kunlik limit xabari o‘rniga pullik so‘rovni davom ettirish.
3. Panel tarifini faol bemor obunasidan olish va Lite/Standard/Premium ranglarini yagona manbaga bog‘lash.
4. Click invoice URL va provider sozlamalarini tekshirib, checkout xatosini tuzatish; endpointlarni qayta joylash va haqiqiy javob bilan sinash.
5. Mobil panel, AI so‘rovi va to‘lovdan keyingi yangilanishni tekshirish.

## Texnik tafsilotlar
- Med Coin yechimi server tomonda atomik va idempotent qoladi.
- Kunlik bepul limit coin bilan to‘lanadigan so‘rovlarni bloklamaydi; yetarli balans bo‘lmasa aniq narx va balans xabari chiqadi.
- Mavjud Payme kassa va super-admin Payme sahifalari o‘zgartirilmaydi.
