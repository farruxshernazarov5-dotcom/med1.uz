# MED-ALL AI Enterprise API Platform — Reja

So'rov juda keng (18 modul). Bularni bitta sprintda qurish iloji yo'q. Quyida 5 ta amaliy fazaga bo'ldim. Har bir fazadan keyin sizga ko'rsatib, tasdiq olaman, keyin keyingisiga o'tamiz.

---

## FAZA 1 — Backend Foundation (Partner & API Key infrastructure)

**Database (yangi jadvallar):**
- `api_partners` — hamkor tashkilotlar (name, contact, org_type, status: pending/approved/suspended, tier, ip_whitelist, allowed_domains)
- `api_keys` — key_hash, secret_hash, partner_id, scopes[], rate_limit_per_min, rate_limit_per_day, expires_at, last_used_at, is_active
- `api_partner_applications` — ariza yuborish (org_name, inn, use_case, requested_scopes, status)
- `api_request_logs` — partner_id, endpoint, method, status_code, response_time_ms, ip, created_at (analytics uchun)
- `api_webhooks` — partner_id, url, events[], secret, is_active, last_delivery_at
- `api_webhook_deliveries` — webhook_id, event, payload, status, retry_count
- RLS: hamkor faqat o'z ma'lumotlarini ko'radi; admin hamma narsani

**Edge function: `api-gateway`** — yagona kirish nuqtasi:
- Header'dan `x-api-key` o'qiydi → hash → `api_keys` ichidan topadi
- Tekshiradi: `is_active`, `expires_at`, `ip_whitelist`, `scopes`
- Rate limit (per minute / per day) — `api_request_logs` count bo'yicha
- So'rovni ichki funksiyaga proxy qiladi (clinic, doctor, lab, pharmacy, emr, ai, payment)
- Har bir so'rovni `api_request_logs`'ga yozadi
- Standart error format (401, 403, 429, 500)

---

## FAZA 2 — Admin Approval Panel

`/admin` ichiga **API Partners** tab:
- Pending applications ro'yxati → Approve/Reject
- Approved partners ro'yxati → API key generate, scopes tahrirlash, suspend
- Har bir partner uchun usage statistikasi (requests, errors, last active)

---

## FAZA 3 — Public Developer Portal (`/developers`)

Yangi route'lar:
- `/developers` — landing (xususiyatlar, tariflar, "Apply" CTA)
- `/developers/apply` — ariza formasi (tashkilot, INN, use case)
- `/developers/docs` — interaktiv API dokumentatsiya (Swagger-uslubida, lekin custom React UI)
- `/developers/docs/:category` — Clinic, Doctor, Diagnostics, Pharmacy, EMR, AI, Payment API'lari
  - Har bir endpoint: method, URL, headers, request body, response misoli, error kodlar
- `/developers/code-examples` — JS / React / Flutter / Python / PHP / Node misollari (copy button bilan)
- `/developers/webhooks` — webhook event ro'yxati va payload'lar
- `/developers/legal` — Developer Agreement, API Usage Policy, Privacy

---

## FAZA 4 — Partner Dashboard (`/partner`)

Approved hamkorlar uchun shaxsiy kabinet:
- API keys: ko'rish, regenerate, rotate, revoke
- Usage analytics: kunlik/oylik grafiklar (Recharts), top endpoints, error rate
- Webhooks: URL qo'shish, event tanlash, test delivery
- Settings: IP whitelist, allowed domains
- Limits & tier: hozirgi tarif, upgrade tugmasi (mavjud SaaS infra'ga ulanadi)
- Notifications: limit yaqinligi, key expired, suspicious activity

---

## FAZA 5 — API Endpoints (kategoriyalar)

Har bir kategoriya `api-gateway` orqali ishlaydigan operatsiyalarni ochadi (faqat scope bo'lsa):
- **Clinic API**: GET clinics, services, doctors; POST booking
- **Doctor API**: GET profiles, schedules, appointments
- **Diagnostics API**: GET tests, results, templates
- **Pharmacy API**: GET medicines, stock; POST e-prescription
- **EMR API**: GET patient records (faqat patient consent token bilan)
- **AI API**: mavjud `ai-external-api`'ni gateway'ga ko'chirish, credit/limit bilan
- **Payment API**: Click/Payme/Stripe checkout yaratish, webhook callback'lar

Har bir endpoint scope nomi bilan himoyalangan: `clinic:read`, `booking:write`, `ai:chat`, va h.k.

---

## Texnik tafsilotlar

- API key format: `mall_live_<random32>` (test uchun `mall_test_`); faqat hash DB'da saqlanadi, plain text faqat yaratilganda 1 marta ko'rsatiladi
- Rate limit: sliding window, `api_request_logs` count(*) WHERE created_at > now() - interval
- Webhook signature: HMAC-SHA256 partner secret bilan, header `X-Mall-Signature`
- Barcha API javoblari: `{ success, data, error, request_id }` formatda
- CORS: API gateway uchun ochiq, lekin har bir kalit `allowed_domains` bilan cheklanadi
- Logging: PII saqlanmaydi, faqat metadata
- SDK (Flutter/RN/iOS/Android): bu **alohida loyiha** — hozir reja'ga kiritmadim, REST API tayyor bo'lgach mustaqil repo'da quriladi

---

## Hozir nima qilishni so'rayman

Tasdiqlasangiz, **Faza 1**dan boshlayman:
1. DB migration (api_partners, api_keys, api_request_logs, api_webhooks, api_webhook_deliveries, applications)
2. `api-gateway` edge function skeleti (auth + rate limit + logging)

Keyin sizga ko'rsataman, tasdiqlasangiz Faza 2'ga o'tamiz.

**Savol:** Reja ma'qulmi, Faza 1'dan boshlaymizmi? Yoki biror fazani o'zgartirish/qo'shish kerakmi?
