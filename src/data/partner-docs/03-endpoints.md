# 3. API endpoint'lar spravochnigi

Barcha yo'llar `{BASE}/v1/...` ko'rinishida. To'liq mashina o'qiy oladigan spetsifikatsiya: https://med1.uz/openapi.json

## 3.1. Tizim

| Metod | Yo'l | Tavsif |
| --- | --- | --- |
| GET | /v1/ping | Ulanish va kalit tekshiruvi |
| GET | /v1/health | Xizmatlar holati |
| GET | /v1/limits | Joriy kalit limitlari va qoldiq kvota |

## 3.2. Autentifikatsiya va foydalanuvchi

| Metod | Yo'l | Tavsif |
| --- | --- | --- |
| POST | /v1/auth/login | Telefon/parol orqali kirish |
| POST | /v1/auth/refresh | Token yangilash |
| POST | /v1/auth/logout | Sessiyani yopish |
| GET | /v1/user/profile | Profil ma'lumoti |
| PATCH | /v1/user/profile | Profilni yangilash |
| GET | /v1/user/credits | Med Coin balansi |

## 3.3. Katalog (Directory)

| Metod | Yo'l | Asosiy parametrlar |
| --- | --- | --- |
| GET | /v1/clinics | city, service, page, limit |
| GET | /v1/clinics/{id} | — |
| GET | /v1/doctors | specialty, city, q, page |
| GET | /v1/doctors/{id} | — |
| GET | /v1/doctors/{id}/slots | date |
| GET | /v1/labs | city, test |
| GET | /v1/pharmacies | city, drug |
| GET | /v1/maps/nearby | lat, lng, radius_km, type |

## 3.4. Qabullar (Appointments)

| Metod | Yo'l | Tavsif |
| --- | --- | --- |
| POST | /v1/appointments | Yangi yozuv yaratish |
| GET | /v1/appointments | Ro'yxat (JWT yoki x-user-id) |
| GET | /v1/appointments/{id} | Bitta yozuv |
| PATCH | /v1/appointments/{id} | Ko'chirish (reschedule) |
| DELETE | /v1/appointments/{id} | Bekor qilish |

```json
POST /v1/appointments
{
  "clinic_id": "uuid",
  "doctor_id": "uuid",
  "date": "2026-09-01",
  "time": "10:00",
  "patient_name": "Ali Valiyev",
  "patient_phone": "+998901234567"
}
```

## 3.5. EMR va sog'liq yozuvlari

| Metod | Yo'l | Talab |
| --- | --- | --- |
| GET | /v1/emr/records | x-user-jwt majburiy |
| GET | /v1/emr/prescriptions | x-user-jwt |
| GET | /v1/emr/lab-results | x-user-jwt |

EMR ma'lumotlari faqat bemor roziligi (JWT) bilan beriladi. API key yolg'iz o'zi yetarli emas.

## 3.6. AI xizmatlari (25+)

Umumiy shakl: `POST /v1/ai/{service}`

| Guruh | Xizmatlar |
| --- | --- |
| Klinik | doctor, symptoms, diagnostics, pharmacist, health-assistant |
| Ixtisoslashgan | oncology, diabetes, cardiology, dietolog, psixolog, fitness, cosmetology |
| Radiologiya 2.0 | radiology/pulmonology, radiology/brain, radiology/bone, radiology/chest-ct, radiology/mammography, radiology/abdomen, radiology/spine |
| Orkestrator | orchestrator (intent klassifikatsiya + marshrutlash) |

```json
POST /v1/ai/doctor
{
  "messages": [{ "role": "user", "content": "Boshim og'riyapti" }],
  "lang": "uz"
}
```

Javob:

```json
{
  "reply": "...",
  "model": "gemini-2.5-flash",
  "tokens": { "input": 120, "output": 340 },
  "cost_coins": 1,
  "request_id": "..."
}
```

Rasm bilan tahlil (radiologiya) uchun `image_base64` yoki `image_url` maydoni yuboriladi.

## 3.7. To'lovlar

| Metod | Yo'l | Tavsif |
| --- | --- | --- |
| POST | /v1/payments/checkout | Click / Payme / Uzum uchun havola |
| GET | /v1/payments/{id} | To'lov holati |
| GET | /v1/payments | Tarix |

## 3.8. Bildirishnomalar

| Metod | Yo'l |
| --- | --- |
| POST | /v1/notifications/send |
| GET | /v1/notifications |

## 3.9. Pagination va filtrlash

Barcha ro'yxat endpoint'lari: `?page=1&limit=20` (limit maksimum 100).

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 4821,
  "has_more": true
}
```
