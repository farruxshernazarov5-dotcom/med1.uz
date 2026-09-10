# Reklama auksioni, yangi muassasalar, shartnoma imzosi va tezlik

Toʻrtta ish bir turda bajariladi. Bosh sahifa hozirgi koʻrinishida qoladi.

## 1. Med1 TOP — 20+ namuna reklama qayta tiklanadi

Hozir 25 ta namuna brend kartochkasi faqat "Tariflar va qoʻllanma" sahifasida turibdi. Ular auksion sahifasiga (`/med1-top`) koʻchiriladi:

- Auksion sahifasida real reklamalar ostida "Boʻsh oʻrinlar — namuna" boʻlimi ochiladi, 25 ta kartochka toʻliq gridda.
- Yoʻnalish (kategoriya) va viloyat boʻyicha filtr, qidiruvga ulanadi.
- Har kartochkada "Bu oʻrinni egallash" tugmasi → `/med1-top/new` (kod va boshlangʻich taklif oldindan toʻldiriladi).
- Har bir kartochka "Namuna / Boʻsh oʻrin" belgisi bilan chiqadi — pullik reklama bilan aralashmaydi.
- Bosh sahifadagi Med1 TOP bloki oʻzgarmaydi.

## 2. Yangi roʻyxatdan oʻtgan muassasalar oʻz boʻlimida koʻrinadi

Yangi diagnostika markazi roʻyxatdan oʻtgan, lekin `/diagnostics` sahifasi faqat statik roʻyxatni koʻrsatmoqda.

- `/diagnostics` sahifasi bazadagi faol markazlarni ham yuklaydi va "Yangi qoʻshilganlar" bloki bilan roʻyxat boshida koʻrsatadi.
- Yangi batafsil sahifa: `/diagnostics/:id` — nomi, logotipi, tavsifi, manzili va xaritasi, telefonlari, ish vaqti, litsenziya/direktor maʼlumoti, jihozlar, xizmatlar narxi, ijtimoiy tarmoq va video havolalari.
- Xodimlar boʻlimi: markaz dashboardida kiritilgan xodimlar (ism, lavozim, mutaxassislik, foto) shu sahifada koʻrsatiladi.
- "Qabulga yozilish" tugmasi mavjud booking oqimiga ulanadi.
- Xuddi shu ommaviy koʻrinish qolgan turlar (dorixona, kosmetologiya, tugʻruqxona, stomatologiya) uchun ham bir xil komponent bilan ishlaydi.

## 3. Shartnomani onlayn imzolash

Ha, onlayn imzolash toʻliq mumkin — tizim allaqachon OTP + qoʻlyozma imzo (barmoq/sichqoncha bilan chizish) modelida ishlaydi, imzolangan hujjat PDF boʻlib QR kod orqali tekshiriladi.

Dashboarddagi yuridik boʻlim aniqlashtiriladi:

- Shartnoma holati aniq koʻrsatiladi: imzolanmagan / imzo kutilmoqda / faol.
- 4 qadamli koʻrsatma: shartnomani oʻqish → maʼlumotlarni tasdiqlash → telefonga kelgan kodni kiritish → imzo chizish.
- Imzolangach: PDF yuklab olish, tekshirish havolasi va shartnoma raqami koʻrinadi.
- Imzosiz muassasalarga eslatma banner chiqadi.

## 4. Sayt tezligi

- Bosh sahifadagi ogʻir bloklar ekranga yaqinlashganda yuklanadi (hozir hammasi birdan yuklanmoqda).
- Bir xil maʼlumot bir necha marta soʻralayotgan joylar keshlanadi.
- Rasm oʻlchamlari va lazy-loading tartibga solinadi, animatsiyalar mobil qurilmada yengillashtiriladi.
- Katta sahifalar (auksion, diagnostika roʻyxati) sahifalab yuklanadi.

## Texnik tafsilotlar

- `SHOWCASE_BRANDS` (25 ta) `Med1TopPage.tsx`ga qoʻshiladi; `Med1TopGuidePage`da qisqa havola qoladi.
- `registered_diagnostics` uchun ommaviy oʻqish RLS/`GRANT` tekshiriladi; kerak boʻlsa `get_partner_organizations`ga oʻxshash public-safe view/RPC qoʻshiladi (telefon/email maskalash qoidasiga rioya).
- Yangi `DiagnosticsDetailPage.tsx` + `OrgPublicProfile` komponenti; `diagnostics_staff`, `diagnostics_services`, `entity_media_links` dan maʼlumot.
- `SignContractDialog` / `ContractRequiredWidget` UI kengaytiriladi — imzo backend logikasi oʻzgarmaydi.
- Performance: `IntersectionObserver` asosidagi `LazySection`, react-query `staleTime`, `content-visibility: auto`.
