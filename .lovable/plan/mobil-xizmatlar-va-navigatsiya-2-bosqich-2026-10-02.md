# Mobil xizmatlar va navigatsiya — 2-bosqich

## Natija
- Pastki menyudagi har bir bo‘lim to‘g‘ridan-to‘g‘ri ochiladigan manzilga ega bo‘ladi; ilova oddiy qayta ochilganda oxirgi ko‘rilgan xavfsiz sahifani tiklaydi, tashqi deep link esa doim ustun turadi.
- Pastki menyu va Med1 AI oynasi ekran o‘quvchi, klaviatura, Escape va ko‘rinadigan fokus bilan boshqariladi; fokus oyna yopilganda AI tugmasiga qaytadi.
- Xizmatlar sahifasida yuklanish skeleti, keshdagi ma’lumot belgisi, qayta urinishli xatolik va bo‘sh natija holatlari bo‘ladi.
- Muassasa kartalarida ish vaqti, telefon, mavjud xizmatlar va qabulga yozilish amali ko‘rinadi.
- Klinikalar, shifokorlar va xizmatlar akkauntga bog‘langan sevimlilar ro‘yxatiga qo‘shiladi; alohida “Sevimlilar” ko‘rinishi orqali filtrlanadi.
- Shifokorlar mutaxassislik, klinika va bo‘sh qabul sanasi/vaqti bo‘yicha qidiriladi; natijadan profilga yoki qabulga o‘tiladi.

## Amalga oshirish
1. Mobil ilova yordamchilariga tashqi URL ochilishi va ilova holati tiklanishini qo‘shish; oxirgi sahifani faqat ichki, xavfsiz yo‘llar uchun saqlash.
2. Pastki navigatsiyani semantik tablar, fokus stillari va AI tugmasi fokusini boshqarish bilan yangilash; AI oynasiga dialog nomi, holat e’loni va klaviatura fokus aylanasini berish.
3. Xizmatlar sahifasida so‘rov xatosi/yuklanishi/kesh holatini ajratish, qayta urinish va xaritada ham holat panelini ko‘rsatish.
4. Muassasa ma’lumotlarini mavjud registrlardan boyitish; ish jadvali, telefon va xizmatlarni kartalar hamda batafsil oynada chiqarish.
5. Foydalanuvchiga tegishli universal sevimlilar jadvalini xavfsiz ruxsatlar bilan yaratish; mobil sahifada yurak tugmasi va alohida ro‘yxat qo‘shish.
6. Mobil shifokor qidiruvini mavjud shifokorlar va qabul jadvali ma’lumotlari bilan bog‘lash; mutaxassislik, klinika, sana va vaqt filtrlari hamda booking havolasini qo‘shish.

## Texnik chegaralar
- Tibbiy ma’lumotlar oflayn saqlanmaydi; faqat ommaviy katalog keshi va oxirgi ichki yo‘l saqlanadi.
- Desktop sahifalar o‘zgarmaydi; yangi oqim mobil qobiq va mobil xizmatlar sahifasida qoladi.
- Barcha ranglar va fokuslar mavjud semantik dizayn tokenlaridan foydalanadi.

## Tekshiruv
- 384×844 ekranda deep link, qayta ochish, klaviatura/fokus, AI oynasi, loading/error/zero holatlari, sevimlilar va shifokor filtrlari tekshiriladi.
- 1280px ekranda mobil interfeys desktop ko‘rinishga xalaqit bermasligi tasdiqlanadi.
- Typecheck/build va tegishli testlar muvaffaqiyatli yakunlanadi.
