# 2. Autentifikatsiya va xavfsiz ulanish

## 2.1. API kalitlar

| Prefiks | Muhit | Ma'lumot |
| --- | --- | --- |
| md1_sandbox_ | Sandbox | Mock (deterministik) ma'lumot, bepul |
| md1_live_ | Production | Real ma'lumot, tarif bo'yicha hisoblanadi |

Kalit faqat bir marta — yaratilgan paytda ko'rsatiladi. Bazada faqat SHA-256 xesh saqlanadi. Yo'qolgan kalit tiklanmaydi, faqat rotatsiya qilinadi.

### Majburiy qoidalar

- Kalit faqat server tomonda saqlanadi (env / secret manager).
- Kalitni brauzer JS, mobil ilova binary yoki git repozitoriyga joylash taqiqlanadi.
- Rotatsiya davri — 90 kun. Eski kalit 24 soat davomida parallel ishlaydi (grace period).
- Kalit sizib chiqqan bo'lsa: Partner Dashboard → Revoke, so'ng security@med1.uz ga xabar.

## 2.2. Header'lar

| Header | Majburiy | Tavsif |
| --- | --- | --- |
| x-api-key | Ha | Partner API kaliti |
| Content-Type | POST/PUT uchun | application/json |
| x-user-jwt | Shartli | End-user nomidan so'rov (mobil/web login) |
| x-user-id | Shartli | Server-to-server rejimda foydalanuvchi UUID |
| x-timestamp | HMAC yoqilgan bo'lsa | Unix seconds |
| x-signature | HMAC yoqilgan bo'lsa | HMAC-SHA256 hex |
| x-request-id | Yo'q (tavsiya) | Idempotentlik va trace uchun UUID |

## 2.3. End-user JWT oqimi

```
POST /v1/auth/login   →  { access_token, refresh_token, expires_in }
GET  /v1/user/profile →  x-api-key + x-user-jwt
POST /v1/auth/refresh →  yangi access_token
```

`access_token` muddati — 1 soat. SDK'lar refresh'ni avtomatik bajaradi.

## 2.4. HMAC-SHA256 imzo

Imzolanadigan satr:

```
{timestamp}.{METHOD}.{path}.{sha256_hex(body)}
```

Bo'sh body uchun `sha256_hex("")` ishlatiladi. Imzo:

```
x-signature = hex(HMAC_SHA256(hmac_secret, signing_string))
```

```bash
TS=$(date +%s)
BODY='{"messages":[{"role":"user","content":"salom"}]}'
P="/v1/ai/doctor"
H=$(printf %s "$BODY" | openssl dgst -sha256 -hex | awk '{print $2}')
SIG=$(printf %s "$TS.POST.$P.$H" | openssl dgst -sha256 -hmac "$MED1_HMAC_SECRET" -hex | awk '{print $2}')

curl -s -X POST "$MED1_BASE$P" \
  -H "x-api-key: $MED1_KEY" -H "x-timestamp: $TS" -H "x-signature: $SIG" \
  -H "Content-Type: application/json" -d "$BODY"
```

Timestamp oynasi — ±300 soniya. Undan tashqarida `401 signature_expired` qaytadi.

## 2.5. Domen va IP cheklovi

- `allowed_domains` — brauzerdan keladigan so'rovlar uchun Origin tekshiruvi (CORS).
- `allowed_ips` — server-to-server kalitlar uchun CIDR ro'yxati.
- Ikkalasi bo'sh bo'lsa kalit faqat sandbox rejimda ishlaydi.

## 2.6. Scope'lar

| Scope | Ruxsat |
| --- | --- |
| clinic:read | Klinikalar katalogi |
| doctor:read | Shifokorlar katalogi, bo'sh vaqtlar |
| diagnostics:read | Laboratoriya va diagnostika xizmatlari |
| pharmacy:read | Dorixonalar va dori qidiruvi |
| appointment:write | Qabulga yozilish, bekor qilish |
| emr:read | Bemor EMR (faqat JWT bilan) |
| ai:chat | AI xizmatlari |
| payment:read | To'lov holati |
| webhook:manage | Webhook yaratish/o'chirish |

Scope yetishmasa `403 insufficient_scope` qaytadi.
