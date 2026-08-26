# CLICK TAS-IX VPS integratsiyasini ishga tushirish

## Maqsad
`89.39.95.5` manzildagi Toshkent/TAS-IX VPS’ni faqat CLICK callbacklari uchun xavfsiz HTTPS reverse proxy qilish va production diagnostikasini shu yo‘lga moslash.

## Amalga oshirish
1. Loyihaga tayyor VPS o‘rnatish skripti va Nginx konfiguratsiyasi qo‘shiladi:
   - `pay.med1.uz/click/prepare` → amaldagi `click-prepare` backend funksiyasi;
   - `pay.med1.uz/click/complete` → amaldagi `click-complete` backend funksiyasi;
   - POST body va `Content-Type` o‘zgartirilmasdan uzatiladi;
   - redirect o‘chiriladi, timeout va xavfsizlik headerlari belgilanadi;
   - Let’s Encrypt TLS va firewall sozlamalari avtomatlashtiriladi.
2. Production diagnostika funksiyasi callback URL sifatida `https://pay.med1.uz/click/prepare` va `/click/complete` ni qaytaradi; backendning to‘g‘ridan-to‘g‘ri endpointlari ichki upstream sifatida qoladi.
3. Super Admin Click paneli yangi statik IP (`89.39.95.5`), TAS-IX proxy holati, DNS/HTTPS tekshiruvlari va CLICK’ga yuboriladigan yangilangan matnni ko‘rsatadi.
4. Callback simulyatsiyasi haqiqiy production proxy yo‘li orqali ham tekshiriladi; mavjud imzo, idempotency va to‘lov biznes-logikasi o‘zgartirilmaydi.

## Tashqi sozlash talabi
- DNS’da `pay.med1.uz` uchun `A → 89.39.95.5` yozuvi yaratiladi.
- Skript VPS’da root/sudo orqali ishga tushiriladi; server paroli loyihaga yoki chatga kiritilmaydi.
- HTTPS ishga tushgach CLICK kabinetida Prepare/Complete URL’lari yangi `pay.med1.uz` manzillariga almashtiriladi va `89.39.95.5` whitelistga beriladi.

## Tekshiruv
DNS, 80/443 portlar, TLS sertifikat, GET readiness, imzolangan Prepare → Complete zanjiri va callback loglari tekshiriladi.
