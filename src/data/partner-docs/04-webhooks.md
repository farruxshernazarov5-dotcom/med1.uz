# 4. Webhook'lar

Webhook — MED1.UZ tomonidan hamkor serveriga yuboriladigan hodisa xabarnomasi.

## 4.1. Ro'yxatdan o'tkazish

```bash
curl -X POST "$MED1_BASE/v1/webhooks" \
  -H "x-api-key: $MED1_KEY" -H "Content-Type: application/json" \
  -d '{
    "url": "https://partner.uz/hooks/med1",
    "events": ["appointment.created", "payment.succeeded"],
    "is_active": true
  }'
```

Talablar: faqat HTTPS, ishonchli sertifikat, javob 5 soniyagacha, `2xx` status.

## 4.2. Hodisalar ro'yxati

| Hodisa | Qachon |
| --- | --- |
| appointment.created | Yangi qabul yaratildi |
| appointment.updated | Vaqt o'zgardi |
| appointment.cancelled | Bekor qilindi |
| appointment.completed | Yakunlandi |
| payment.succeeded | To'lov muvaffaqiyatli |
| payment.failed | To'lov muvaffaqiyatsiz |
| payment.refunded | Qaytarildi |
| lab_result.ready | Laboratoriya natijasi tayyor |
| prescription.issued | Retsept berildi |
| ai.request.completed | AI so'rov yakunlandi |
| apikey.rotated | Kalit almashtirildi |
| partner.suspended | Partner vaqtincha to'xtatildi |

## 4.3. Payload formati

```json
{
  "id": "evt_01H...",
  "type": "appointment.created",
  "created_at": "2026-08-13T10:00:00Z",
  "api_version": "v1",
  "sandbox": false,
  "data": {
    "appointment_id": "uuid",
    "clinic_id": "uuid",
    "doctor_id": "uuid",
    "status": "pending",
    "date": "2026-09-01",
    "time": "10:00"
  }
}
```

## 4.4. Imzoni tekshirish

Har bir yuborishda header'lar keladi:

```
x-med1-timestamp: 1786000000
x-med1-signature: hex(HMAC_SHA256(webhook_secret, "{timestamp}.{raw_body}"))
```

Node.js misoli:

```js
import crypto from "node:crypto";

function verify(rawBody, ts, sig, secret) {
  const expected = crypto.createHmac("sha256", secret)
    .update(`${ts}.${rawBody}`).digest("hex");
  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  const fresh = Math.abs(Date.now() / 1000 - Number(ts)) < 300;
  return ok && fresh;
}
```

Imzo yoki timestamp mos kelmasa so'rov `401` bilan rad etilishi shart.

## 4.5. Qayta urinish (retry) siyosati

| Urinish | Kechikish |
| --- | --- |
| 1 | darhol |
| 2 | 30 soniya |
| 3 | 2 daqiqa |
| 4 | 10 daqiqa |
| 5 | 1 soat |
| 6 | 6 soat |

6 urinishdan so'ng hodisa DLQ (dead letter queue) ga tushadi va Partner Dashboard → Webhook Deliveries bo'limida qo'lda qayta yuborilishi mumkin.

## 4.6. Idempotentlik

Bir xil `id` bilan hodisa takror kelishi mumkin. Hamkor tomonda `event.id` bo'yicha unikal indeks yaratib, takrorlarni e'tiborsiz qoldirish majburiy.
