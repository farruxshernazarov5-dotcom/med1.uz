# Med1 AI mobil markazini kengaytirish

## Maqsad
Mobil AI oynasida 23 ta xizmatni (14 asosiy, 7 radiologiya, 2 maxsus) tez topish va qulay ochish imkonini berish.

## Amalga oshirish
- Yuqorida **Tezkor / Ommabop**, **14 ta AI Asosiy**, **Radiologiya (7 sub)** va **Maxsus AI** toifalarini gorizontal, klaviatura bilan boshqariladigan tablar sifatida qo‘shish.
- Nom va tavsif bo‘yicha darhol filtrlovchi qidiruv satri, natijalar soni hamda bo‘sh qidiruv holatini yaratish.
- Har bir xizmatga o‘ziga xos rangli ikonka, qisqa tavsif va tegishli `Ommabop` yoki `Yangi` badge berish; mavjud sahifalarga yo‘naltirish.
- Oynani silliq ichki scroll, xavfsiz pastki chekka va yopilganda markaziy AI tugmasiga qaytadigan fokus bilan saqlash.
- Xizmat tanlash va tab almashtirishda mobil haptik javob berish; webda bu xavfsiz no-op bo‘lib qoladi.
- Ekran o‘quvchi uchun tab, qidiruv, natijalar va xizmat tugmalariga aniq nomlar/statuslar; fokus halqalari va klaviatura navigatsiyasini ta’minlash.

## Tekshiruv
- Mobil o‘lchamda barcha toifalar, qidiruv, bo‘sh natija va AI yo‘liga o‘tishni tekshirish.
- Klaviaturada fokusning oyna ichiga kirishi va yopilganda AI tugmasiga qaytishini tekshirish.
- Desktop ko‘rinishga xalaqit bermasligi va loyiha build holatini tasdiqlash.

## Texnik tafsilotlar
- O‘zgarish faqat bemor mobil qobig‘idagi `MobileAIHubSheet` taqdimot qatlamida bo‘ladi; AI xizmatlarining mavjud biznes mantiqi va sahifalari o‘zgarmaydi.
- Barcha ranglar mavjud semantik dizayn tokenlari orqali beriladi; yangi ma’lumot yoki server jadvali kerak emas.
