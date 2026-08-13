# 5. Xatolar, limitlar va ishonchlilik

## 5.1. Xato formati

```json
{
  "error": {
    "code": "insufficient_scope",
    "message": "API key does not include ai:chat scope",
    "request_id": "req_01H...",
    "docs": "https://med1.uz/partner-docs#errors"
  }
}
```

## 5.2. HTTP status kodlari

| Status | Kod | Sabab va yechim |
| --- | --- | --- |
| 400 | invalid_request | Body yoki parametr noto'g'ri — sxemani tekshiring |
| 401 | invalid_api_key | Kalit noto'g'ri yoki bekor qilingan |
| 401 | signature_expired | x-timestamp ±300s oynasidan tashqarida |
| 401 | invalid_signature | HMAC noto'g'ri hisoblangan |
| 402 | insufficient_credits | Med Coin balansi yetarli emas |
| 403 | insufficient_scope | Kalitda kerakli scope yo'q |
| 403 | domain_not_allowed | Origin allowed_domains ro'yxatida emas |
| 403 | ip_not_allowed | IP whitelist'da emas |
| 404 | not_found | Resurs topilmadi |
| 409 | conflict | Slot band yoki takroriy yozuv |
| 422 | validation_failed | Maydonlar validatsiyadan o'tmadi |
| 429 | rate_limited | Limit oshdi — Retry-After header'iga qarang |
| 500 | internal_error | Ichki xato — request_id bilan murojaat qiling |
| 503 | upstream_unavailable | AI provayder vaqtincha ishlamayapti |

## 5.3. Rate limit

| Tarif | So'rov/daqiqa | AI so'rov/kun | Burst |
| --- | --- | --- | --- |
| Sandbox | 30 | 100 | 10 |
| Starter | 120 | 1 000 | 30 |
| Business | 600 | 10 000 | 100 |
| Enterprise | shartnoma bo'yicha | shartnoma bo'yicha | shartnoma bo'yicha |

Har bir javobda:

```
x-ratelimit-limit: 120
x-ratelimit-remaining: 118
x-ratelimit-reset: 1786000060
```

429 holatida `Retry-After` (soniya) qaytadi. Eksponensial backoff + jitter bilan qayta urinish tavsiya etiladi.

## 5.4. Idempotentlik

Yaratuvchi (POST) so'rovlar uchun `x-request-id` (UUID v4) yuboring. 24 soat ichida bir xil `x-request-id` bilan kelgan so'rov birinchi natijani qaytaradi, dublikat yaratilmaydi.

## 5.5. Timeout va retry tavsiyalari

| So'rov turi | Timeout | Retry |
| --- | --- | --- |
| Katalog (GET) | 10 s | 3 marta |
| Qabul yaratish | 15 s | faqat 5xx/timeout, x-request-id bilan |
| AI matn | 60 s | 1 marta |
| AI rasm tahlili | 120 s | retry yo'q |

## 5.6. Kuzatuv (observability)

- Har bir javobda `x-request-id` bo'ladi — logingizda saqlang.
- Nosozlik bo'yicha murojaatda `request_id`, vaqt (UTC) va endpoint ko'rsatilishi shart.
- Partner Dashboard → API Logs bo'limida oxirgi 30 kunlik so'rovlar ko'rinadi.
