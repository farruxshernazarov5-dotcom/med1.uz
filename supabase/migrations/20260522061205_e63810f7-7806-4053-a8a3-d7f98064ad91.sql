
-- Add English columns
ALTER TABLE public.contract_templates
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS summary_en TEXT,
  ADD COLUMN IF NOT EXISTS body_en TEXT;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS body_en TEXT;

ALTER TABLE public.contract_categories
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Backfill EN with UZ placeholder (admins can refine later via Legal Admin Dashboard)
UPDATE public.contract_templates SET title_en = title_uz WHERE title_en IS NULL;
UPDATE public.contract_templates SET summary_en = summary_uz WHERE summary_en IS NULL;
UPDATE public.contract_templates SET body_en = body_uz WHERE body_en IS NULL;
UPDATE public.contract_categories SET name_en = name_uz WHERE name_en IS NULL;

-- New categories
INSERT INTO public.contract_categories (slug, name_uz, name_ru, name_en, description_uz)
VALUES
  ('cosmetology','Kosmetologiya markazi','Косметологический центр','Cosmetology Center','Kosmetologiya xizmatlari va estetika muolajalari uchun shartnomalar'),
  ('medtech','MedTech yetkazib beruvchi','MedTech поставщик','MedTech Vendor','Tibbiy uskunalar va medtech integratsiyalari uchun shartnomalar'),
  ('doctor','Mustaqil shifokor','Независимый врач','Independent Doctor','Mustaqil amaliyot olib boruvchi shifokorlar uchun shartnomalar'),
  ('staff','Xodim maxfiyligi','Конфиденциальность сотрудника','Staff Confidentiality','Xodimlar uchun maxfiylik va NDA shartnomalari'),
  ('telemedicine','Telemeditsina roziligi','Согласие на телемедицину','Telemedicine Consent','Onlayn konsultatsiya va telemeditsina uchun bemor roziligi')
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  description_en = EXCLUDED.description_en;

-- Seed 5 new templates
INSERT INTO public.contract_templates
  (category_id, slug, title_uz, title_ru, title_en, summary_uz, summary_ru, summary_en, body_uz, body_ru, body_en, allowed_roles, is_active, is_mandatory, jurisdiction)
SELECT c.id, t.slug, t.title_uz, t.title_ru, t.title_en, t.summary_uz, t.summary_ru, t.summary_en, t.body_uz, t.body_ru, t.body_en, t.roles, true, t.mandatory, 'UZ'
FROM (VALUES
  ('cosmetology','cosmetology-center-agreement',
   'Kosmetologiya Markazi Xizmat Shartnomasi',
   'Договор косметологического центра',
   'Cosmetology Center Service Agreement',
   'Kosmetologiya markazlari uchun MED1.UZ platformasidan foydalanish shartnomasi',
   'Соглашение об использовании платформы MED1.UZ косметологическими центрами',
   'Agreement for cosmetology centers using the MED1.UZ platform',
   E'1. UMUMIY QOIDALAR\nUshbu shartnoma MED-ALL AI SYSTEM MChJ (keyingi o''rinlarda — "Platforma") va Kosmetologiya markazi (keyingi o''rinlarda — "Markaz") o''rtasida tuzilgan.\n\n2. XIZMAT MAVZUSI\nPlatforma Markazga quyidagi modullar bilan ta''minlaydi:\n- Bemorlar boshqaruvi (CRM)\n- Estetik muolajalar protokoli\n- Inventarizatsiya (mahsulotlar, kosmetika)\n- Moliyaviy hisobot va to''lovlar\n- Onlayn yozilish va kalendar\n- Foto-protokollar (oldin/keyin)\n\n3. JAVOBGARLIK\nPlatforma faqat texnologik infratuzilma. Tibbiy va estetik javobgarlik to''liq Markazga tegishli. Platforma quyidagilar uchun javobgar emas:\n- Muolaja natijalari\n- Allergik reaktsiyalar\n- Bemor bilan nizolar\n\n4. MAXFIYLIK\nMarkaz bemor ma''lumotlarini O''zbekiston Respublikasi qonunchiligi va GDPR talablariga muvofiq saqlashga majbur.\n\n5. TO''LOV\nObuna tariflari saas-tariff.med1.uz sahifasida. Avtomatik yangilanish faollashtirilgan.\n\n6. SUD JARAYONI\nNizolar Toshkent shahar Iqtisodiy sudida ko''rib chiqiladi.',
   E'1. ОБЩИЕ ПОЛОЖЕНИЯ\nНастоящий договор заключён между MED-ALL AI SYSTEM ООО ("Платформа") и Косметологическим центром ("Центр").\n\n2. ПРЕДМЕТ ДОГОВОРА\nПлатформа предоставляет Центру модули: CRM пациентов, протоколы эстетических процедур, инвентаризация, финансовая отчётность, онлайн-запись, фото-протоколы.\n\n3. ОТВЕТСТВЕННОСТЬ\nПлатформа — только технологическая инфраструктура. Медицинская и эстетическая ответственность полностью лежит на Центре.\n\n4. КОНФИДЕНЦИАЛЬНОСТЬ\nЦентр обязан хранить данные пациентов согласно законодательству РУз и требованиям GDPR.\n\n5. ОПЛАТА\nТарифы на странице saas-tariff.med1.uz. Автопродление включено.\n\n6. РАЗРЕШЕНИЕ СПОРОВ\nСпоры рассматриваются в Экономическом суде г. Ташкент.',
   E'1. GENERAL PROVISIONS\nThis agreement is concluded between MED-ALL AI SYSTEM LLC ("Platform") and the Cosmetology Center ("Center").\n\n2. SUBJECT MATTER\nThe Platform provides the Center with modules: Patient CRM, aesthetic procedure protocols, inventory, financial reporting, online booking, before/after photo protocols.\n\n3. LIABILITY\nThe Platform is solely a technology infrastructure. All medical and aesthetic liability remains with the Center. The Platform is not liable for procedure outcomes, allergic reactions, or patient disputes.\n\n4. CONFIDENTIALITY\nThe Center must store patient data in accordance with the laws of the Republic of Uzbekistan and GDPR requirements.\n\n5. PAYMENT\nSubscription tariffs at saas-tariff.med1.uz. Auto-renewal enabled.\n\n6. DISPUTE RESOLUTION\nDisputes are heard in the Economic Court of Tashkent.',
   ARRAY['cosmetology','admin'], true),

  ('medtech','medtech-vendor-agreement',
   'MedTech Yetkazib Beruvchi Shartnomasi',
   'Договор MedTech поставщика',
   'MedTech Vendor Agreement',
   'Tibbiy uskunalar yetkazib beruvchilari uchun marketplace shartnomasi',
   'Договор маркетплейса для поставщиков медицинского оборудования',
   'Marketplace agreement for medical equipment vendors',
   E'1. SHARTNOMA TARAFLARI\nMED-ALL AI SYSTEM MChJ ("Platforma") va Yetkazib beruvchi ("Vendor").\n\n2. MAVZU\nVendor o''z mahsulotlarini med1.uz medtech katalogida joylashtirish huquqini oladi.\n\n3. KOMISSIYA\nHar bir sotuvdan Platforma 5-15% komissiya ushlab qoladi (tarifga qarab).\n\n4. SIFAT KAFOLATI\nVendor mahsulotlar sertifikati va sifati uchun to''liq javobgar.\n\n5. YETKAZIB BERISH\nLogistika va kafolat xizmatlari Vendor zimmasida.\n\n6. SUD\nToshkent shahar Iqtisodiy sudi.',
   E'1. СТОРОНЫ\nMED-ALL AI SYSTEM ООО ("Платформа") и Поставщик ("Vendor").\n\n2. ПРЕДМЕТ\nVendor получает право размещать товары в medtech-каталоге med1.uz.\n\n3. КОМИССИЯ\nС каждой продажи Платформа удерживает 5-15% комиссии (зависит от тарифа).\n\n4. ГАРАНТИЯ КАЧЕСТВА\nVendor несёт полную ответственность за сертификацию и качество.\n\n5. ДОСТАВКА\nЛогистика и гарантийное обслуживание — на стороне Vendor.\n\n6. СУД\nЭкономический суд г. Ташкент.',
   E'1. PARTIES\nMED-ALL AI SYSTEM LLC ("Platform") and the Vendor ("Vendor").\n\n2. SUBJECT MATTER\nThe Vendor is granted the right to list products in the med1.uz medtech catalog.\n\n3. COMMISSION\nThe Platform retains a 5-15% commission on each sale (depending on tariff).\n\n4. QUALITY ASSURANCE\nThe Vendor is fully responsible for product certification and quality.\n\n5. DELIVERY\nLogistics and warranty service are the Vendor''s responsibility.\n\n6. JURISDICTION\nEconomic Court of Tashkent.',
   ARRAY['medtech','admin'], true),

  ('doctor','doctor-platform-agreement',
   'Mustaqil Shifokor Platforma Shartnomasi',
   'Договор независимого врача',
   'Independent Doctor Platform Agreement',
   'Mustaqil shifokorlar uchun MED1.UZ platformasida amaliyot olib borish shartnomasi',
   'Договор для независимых врачей о практике на платформе MED1.UZ',
   'Agreement for independent doctors practicing on the MED1.UZ platform',
   E'1. TARAFLAR\nMED-ALL AI SYSTEM MChJ ("Platforma") va Shifokor.\n\n2. XIZMATLAR\nShifokorga taqdim etiladi:\n- Shaxsiy bemorlar bazasi (CRM)\n- E-retsept moduli\n- Onlayn konsultatsiya (Jitsi)\n- Moliyaviy hisobot va P&L\n- AI yordamchi\n\n3. LITSENZIYA\nShifokor amaldagi tibbiyot litsenziyasiga ega bo''lishi shart. Litsenziya nusxasi yuklab qo''yiladi.\n\n4. JAVOBGARLIK\nBarcha tibbiy qarorlar uchun shifokor shaxsan javobgar. Platforma tibbiy maslahat bermaydi.\n\n5. KOMISSIYA\nOnlayn konsultatsiyadan 10%, retseptdan 0%. SaaS tariflar alohida.\n\n6. SUD\nToshkent shahar tuman sudi (shifokor yashash joyi).',
   E'1. СТОРОНЫ\nMED-ALL AI SYSTEM ООО ("Платформа") и Врач.\n\n2. УСЛУГИ\nВрачу предоставляются: личная база пациентов (CRM), модуль э-рецепта, онлайн-консультация (Jitsi), финансовая отчётность и P&L, AI-помощник.\n\n3. ЛИЦЕНЗИЯ\nВрач должен иметь действующую медицинскую лицензию. Копия загружается в систему.\n\n4. ОТВЕТСТВЕННОСТЬ\nВрач лично несёт ответственность за все медицинские решения. Платформа не оказывает медицинских консультаций.\n\n5. КОМИССИЯ\nС онлайн-консультаций — 10%, с рецептов — 0%. SaaS-тарифы оплачиваются отдельно.\n\n6. СУД\nРайонный суд г. Ташкент по месту жительства врача.',
   E'1. PARTIES\nMED-ALL AI SYSTEM LLC ("Platform") and the Doctor.\n\n2. SERVICES\nThe Doctor is provided with: personal patient base (CRM), e-prescription module, online consultation (Jitsi), financial reporting and P&L, AI assistant.\n\n3. LICENSING\nThe Doctor must hold a valid medical license. A copy is uploaded to the system.\n\n4. LIABILITY\nThe Doctor is personally liable for all medical decisions. The Platform does not provide medical advice.\n\n5. COMMISSION\n10% on online consultations, 0% on prescriptions. SaaS tariffs paid separately.\n\n6. JURISDICTION\nDistrict court of Tashkent at the Doctor''s place of residence.',
   ARRAY['doctor','admin'], true),

  ('staff','staff-nda-agreement',
   'Xodim Maxfiylik (NDA) Shartnomasi',
   'Соглашение о неразглашении (NDA)',
   'Staff Non-Disclosure Agreement',
   'Tashkilot xodimlari uchun bemor ma''lumotlari va kompaniya sirini saqlash majburiyati',
   'Обязательство сотрудников хранить данные пациентов и коммерческую тайну',
   'Obligation for staff to maintain confidentiality of patient data and trade secrets',
   E'1. MAVZU\nUshbu shartnoma Xodim va Tashkilot o''rtasida maxfiy ma''lumotlarni saqlash majburiyatini belgilaydi.\n\n2. MAXFIY MA''LUMOTLAR\n- Bemorlarning shaxsiy va tibbiy ma''lumotlari\n- Tashkilotning moliyaviy ko''rsatkichlari\n- Texnik tizimlarga kirish parollari\n- Hamkorlar va yetkazib beruvchilar ro''yxati\n\n3. MAJBURIYATLAR\nXodim:\n- Ma''lumotlarni 3-shaxslarga oshkor qilmaydi\n- Faqat ish faoliyati doirasida foydalanadi\n- Ishdan bo''shaganidan keyin ham 5 yil davomida sirni saqlaydi\n\n4. JAVOBGARLIK\nQoidabuzarlik uchun:\n- Mehnat shartnomasi bekor qilinadi\n- Zarar miqdorida moddiy javobgarlik\n- Jinoiy javobgarlik (O''zR JK 144-modda)\n\n5. AMAL QILISH MUDDATI\nIsh davomida + 5 yil ishdan keyin.',
   E'1. ПРЕДМЕТ\nНастоящее соглашение устанавливает обязательство Сотрудника хранить конфиденциальные данные.\n\n2. КОНФИДЕНЦИАЛЬНАЯ ИНФОРМАЦИЯ\n- Персональные и медицинские данные пациентов\n- Финансовые показатели организации\n- Пароли доступа к системам\n- Список партнёров и поставщиков\n\n3. ОБЯЗАТЕЛЬСТВА\nСотрудник:\n- Не раскрывает информацию третьим лицам\n- Использует только в рамках работы\n- Хранит тайну 5 лет после увольнения\n\n4. ОТВЕТСТВЕННОСТЬ\n- Расторжение трудового договора\n- Материальная ответственность в размере ущерба\n- Уголовная ответственность (ст. 144 УК РУз)\n\n5. СРОК ДЕЙСТВИЯ\nВо время работы + 5 лет после.',
   E'1. SUBJECT MATTER\nThis agreement establishes the Staff member''s obligation to maintain confidential data.\n\n2. CONFIDENTIAL INFORMATION\n- Patient personal and medical data\n- Organization''s financial figures\n- System access passwords\n- List of partners and suppliers\n\n3. OBLIGATIONS\nThe Staff member shall:\n- Not disclose information to third parties\n- Use it only within work scope\n- Maintain confidentiality for 5 years after termination\n\n4. LIABILITY\n- Termination of employment\n- Material liability in the amount of damages\n- Criminal liability (Art. 144 of the Criminal Code of the RUz)\n\n5. TERM\nDuring employment + 5 years thereafter.',
   ARRAY['admin','clinic','dental','pharmacy','diagnostics','maternity','cosmetology','medtech'], true),

  ('telemedicine','telemedicine-consent',
   'Telemeditsina Roziligi',
   'Согласие на телемедицину',
   'Telemedicine Consent',
   'Onlayn tibbiy konsultatsiya uchun bemor roziligi (videokall, chat, AI tahlil)',
   'Согласие пациента на онлайн медицинскую консультацию (видеозвонок, чат, AI)',
   'Patient consent for online medical consultation (video call, chat, AI analysis)',
   E'1. ROZILIK MAVZUSI\nBemor (men) MED1.UZ platformasida onlayn tibbiy konsultatsiya olishga rozilik bildiraman.\n\n2. CHEKLOVLAR\nMen tushunaman va qabul qilaman:\n- Onlayn konsultatsiya ofis tashrifining to''liq o''rnini bosa olmaydi\n- Shoshilinch holatlarda 103 raqamiga murojaat qilaman\n- Diagnoz onlayn rejimda taxminiy bo''lishi mumkin\n\n3. MA''LUMOTLAR\nMen shifokorga to''g''ri va to''liq ma''lumot beraman. Yolg''on yoki to''liqsiz ma''lumot uchun mas''uliyat menga yuklanadi.\n\n4. AI TAHLIL\nAI faqat yordamchi vosita. AI tavsiyalari tibbiy maslahat emas.\n\n5. YOZIB OLISH\nKonsultatsiya yozib olinishi mumkin va tibbiy karta sifatida saqlanadi.\n\n6. TO''LOV\nTo''lov xizmat boshlanishidan oldin amalga oshiriladi. Texnik nosozlik uchun pul qaytariladi.',
   E'1. ПРЕДМЕТ СОГЛАСИЯ\nЯ, Пациент, даю согласие на онлайн медицинскую консультацию на платформе MED1.UZ.\n\n2. ОГРАНИЧЕНИЯ\nЯ понимаю и принимаю:\n- Онлайн-консультация не заменяет очный приём\n- В экстренных случаях я обращаюсь по номеру 103\n- Диагноз в онлайн-режиме может быть предварительным\n\n3. ИНФОРМАЦИЯ\nЯ предоставляю врачу правдивую и полную информацию. Ответственность за ложные данные несу я.\n\n4. AI АНАЛИЗ\nAI — лишь вспомогательный инструмент. Рекомендации AI не являются медицинским советом.\n\n5. ЗАПИСЬ\nКонсультация может быть записана и сохранена как медкарта.\n\n6. ОПЛАТА\nОплата до начала услуги. При технической ошибке — возврат средств.',
   E'1. SUBJECT OF CONSENT\nI, the Patient, consent to receive online medical consultation on the MED1.UZ platform.\n\n2. LIMITATIONS\nI understand and accept:\n- Online consultation cannot fully replace an in-person visit\n- In emergencies I will call 103\n- Online diagnosis may be preliminary\n\n3. INFORMATION\nI shall provide the doctor with accurate and complete information. Responsibility for false data lies with me.\n\n4. AI ANALYSIS\nAI is only a supportive tool. AI recommendations are not medical advice.\n\n5. RECORDING\nThe consultation may be recorded and stored as a medical record.\n\n6. PAYMENT\nPayment is made before service begins. Refunds available for technical failures.',
   ARRAY['patient'], true)
) AS t(cat_slug, slug, title_uz, title_ru, title_en, summary_uz, summary_ru, summary_en, body_uz, body_ru, body_en, roles, mandatory)
JOIN public.contract_categories c ON c.slug = t.cat_slug
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  summary_en = EXCLUDED.summary_en,
  body_en = EXCLUDED.body_en,
  updated_at = now();
