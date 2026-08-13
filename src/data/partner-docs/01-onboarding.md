# 1. Boshlash va Onboarding

MED1.UZ Partner API — tibbiy ekotizim (klinikalar, shifokorlar, diagnostika, dorixona, EMR, to'lov va 25+ AI xizmat) bilan integratsiya qilish uchun yagona REST interfeys.

## 1.1. Umumiy ma'lumot

| Parametr | Qiymat |
| --- | --- |
| Protokol | HTTPS (TLS 1.2+) |
| Format | JSON (UTF-8) |
| Versiya | v1 |
| Base URL | https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway |
| OpenAPI | https://med1.uz/openapi.json |
| Swagger UI | https://med1.uz/api-docs |
| Sandbox | Bir xil Base URL, kalit prefiksi `md1_sandbox_` |

## 1.2. Integratsiya kanallari

| Kanal | Autentifikatsiya | Tavsiya etilgan scope |
| --- | --- | --- |
| Mobil ilova (Flutter, Kotlin, Swift, React Native) | End-user JWT + API key | ai:chat, clinic:read, doctor:read |
| Web sayt / widget | Server-side API key + domen whitelist | clinic:read, doctor:read |
| Server-to-server (HIS, sug'urta, HAMBI) | API key + HMAC-SHA256 + IP whitelist | to'liq scope to'plami |
| Webhook qabul qiluvchi | HMAC imzo tekshiruvi | — |

## 1.3. Onboarding bosqichlari

1. Ariza topshirish — https://med1.uz/partnership yoki https://med1.uz/developers
2. Yuridik hujjatlarni taqdim etish (4-bo'limga qarang: Yuridik talablar)
3. Hamkorlik shartnomasini imzolash — https://med1.uz/partner-terms
4. Super Admin tomonidan profil tasdiqlanishi (`status: approved`)
5. Sandbox kaliti berilishi (`md1_sandbox_...`) va to'liq test
6. Texnik ko'rik (security review) — domen, IP, webhook URL tekshiruvi
7. Production kaliti (`md1_live_...`) va limitlarni faollashtirish
8. Monitoring va qo'llab-quvvatlash rejimiga o'tish

## 1.4. Birinchi so'rov (Hello, MED1)

```bash
export MED1_KEY="md1_sandbox_..."
export MED1_BASE="https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway"

curl -s "$MED1_BASE/v1/ping" -H "x-api-key: $MED1_KEY"
```

Javob:

```json
{ "ok": true, "version": "v1", "sandbox": true, "ts": "2026-08-13T10:00:00Z" }
```

## 1.5. Rasmiy SDK'lar

| Til | Paket / fayl | Holat |
| --- | --- | --- |
| Dart / Flutter | med1_api | Tayyor |
| JavaScript / TypeScript | @med1uz/api | Tayyor |
| Python | med1-api | Tayyor |
| PHP | med1uz/api-php | Tayyor |
| Kotlin / Android | Med1Client.kt (drop-in) | Tayyor |
| Swift / iOS | Med1Client.swift (drop-in) | Tayyor |
| cURL / bash | snippet to'plami | Tayyor |

Barcha SDK manbalari: https://med1.uz/sdk/manifest.json
