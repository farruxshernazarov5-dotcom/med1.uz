
# MED1.UZ Mobile API Platform va Super Admin API Management Center

**Umumiy strategiya:** Loyihada allaqachon mustahkam poydevor bor — `api-gateway` edge function, `api_keys`, `api_partners`, `api_request_logs`, `api_webhooks`, `api_webhook_deliveries` jadvallari, OpenAPI JSON, Swagger UI (`/api-docs`), va 14 ta AI edge functions. Yangi kod yozish o'rniga **mavjud infratuzilmani kengaytiramiz**, dublikat qilmaymiz.

Mobil ilova = **Flutter**. Autentifikatsiya = **ikki xil**: end-user'lar uchun Supabase JWT (mobile app login), tashqi hamkorlar uchun OAuth 2.0 + API Key (hozirgidek).

---

## Bosqich 1 — Baza kengaytirish (DB + Gateway)

**Migration:**
- `api_endpoints` jadvali — barcha endpointlarni ro'yxatga olish (path, method, scope, category: mobile/web/hambi/partner/ai, description, is_deprecated, rate_limit_override)
- `api_oauth_clients` jadvali — OAuth 2.0 clientlar (client_id, client_secret_hash, redirect_uris, scopes, partner_id)
- `api_sdk_versions` jadvali — SDK release'lar (language, version, download_url, changelog)
- `api_monitoring_alerts` jadvali — real-time alert konfiguratsiya (error_rate_threshold, latency_threshold, notify_channel)
- Barchasiga GRANT + RLS (faqat admin ko'ra oladi)

**Gateway kengaytirish (`supabase/functions/api-gateway/index.ts`):**
- Yangi endpointlar (ROUTES map'ga qo'shish):
  - `POST /v1/auth/login`, `/register`, `/otp/send`, `/otp/verify`, `/refresh`, `/logout`, `/forgot-password`
  - `GET/PATCH /v1/user/profile`, `POST /v1/user/avatar`, `PATCH /v1/user/settings`
  - `POST /v1/ai/{doctor|symptoms|laboratory|radiology|pregnancy|baby-care|psychologist|diet|pharmacy|cosmetology|fitness|assistant|monitoring|prediction}` — mavjud `ai-*` edge functionlarga proxy
  - `GET /v1/clinics/:id`, `/doctors/:id`, `/diagnostics/:id`, `/maternity`, `/pharmacies/:id`
  - `POST /v1/appointments`, `DELETE /v1/appointments/:id`, `GET /v1/appointments/history`, `POST /v1/appointments/:id/checkin`
  - `GET /v1/emr/records`, `/analyses`, `/prescriptions`, `/diagnoses`
  - `POST /v1/payments/click|payme|uzum`, `GET /v1/payments/history`, `/subscriptions`, `POST /v1/med-coin/purchase`
  - `POST /v1/notifications/push|sms|email|telegram`
  - `GET /v1/maps/nearby`, `/geofence`
- Har bir request `api_request_logs`ga yoziladi (allaqachon bor)
- Rate limit: minute + day tekshiruvi (per key)
- Sandbox rejim: `environment='sandbox'` bo'lgan kalitlar `/v1/sandbox/*` prefiksga yo'naltiriladi, test ma'lumotlar qaytaradi

---

## Bosqich 2 — Super Admin API Management Center UI

`src/components/admin/api/` papkasida modul:

- **`APIManagementCenter.tsx`** — asosiy shell, tabbed navigation
- **`APIDashboard.tsx`** — KPI kartlar (requests/24h, error rate, avg latency, active keys, top endpoints)
- **`APIEndpointsManager.tsx`** — `api_endpoints` CRUD, scope tayinlash, deprecated belgilash
- **`APIKeysManager.tsx`** — `api_keys` boshqaruvi (yaratish, revoke, rotate, scope tahrirlash)
- **`OAuthClientsManager.tsx`** — OAuth clientlar
- **`JWTTokensViewer.tsx`** — faol sessiyalar (auth.sessions dan)
- **`MobileAPIPanel.tsx`, `WebAPIPanel.tsx`, `HambiAPIPanel.tsx`, `PartnerAPIPanel.tsx`, `AIAPIPanel.tsx`** — kategoriya bo'yicha filtered view
- **`WebhookManager.tsx`** — `api_webhooks` + `api_webhook_deliveries` (mavjud)
- **`APIMonitoring.tsx`** — real-time alerts, health status
- **`APILogsViewer.tsx`** — `api_request_logs` filter/search
- **`APIAnalytics.tsx`** — Recharts: requests over time, top endpoints, channel breakdown (android/ios/web/hambi/telegram/partner)
- **`APIRateLimits.tsx`** — per-key/per-tier limitlarni tahrirlash
- **`APISecurityCenter.tsx`** — IP whitelist, CORS, audit log
- **`APIDocumentation.tsx`** — Developer Portal iframe/link
- **`SDKDownloads.tsx`** — SDK versiyalari download
- **`SandboxPanel.tsx`** — test API key generatsiyasi, test user

**Yo'nalish:** `/admin/api-center` route (faqat `admin` roli). `AdminDashboard.tsx`ga link qo'shiladi.

---

## Bosqich 3 — Developer Portal + OpenAPI

- **`public/openapi.json` kengaytirish** — barcha yangi endpointlarni qo'shish (auth, user, ai, appointments, emr, payments, notifications, maps). Har birida request/response schema, security scheme (bearerAuth + apiKeyAuth), example.
- **`src/pages/DeveloperPortalPage.tsx`** — public sahifa `/developers`:
  - Getting Started
  - Authentication (JWT vs OAuth vs API Key)
  - Endpoint reference (Swagger UI embed — mavjud `/api-docs`)
  - SDK downloads (Flutter, JS, Kotlin, Swift, React Native, Node, Python, Laravel)
  - Code samples har bir endpoint uchun (cURL, Dart/Flutter, JavaScript, Kotlin, Swift)
  - Rate limits, error codes, webhooks docs, changelog
- Code sample generator: OpenAPI spec'dan avtomatik yaratish (client-side)

---

## Bosqich 4 — Flutter SDK

`sdk/flutter/med1_api/` papkasida standalone Dart package (repo ichida, alohida publish):
- `Med1ApiClient` — Dio-based HTTP client, auto JWT refresh, retry logic
- `AuthApi`, `UserApi`, `AiApi`, `ClinicsApi`, `AppointmentsApi`, `EmrApi`, `PaymentsApi`, `NotificationsApi`, `MapsApi`
- Model class'lar (freezed)
- `README.md` — pub.dev uchun tayyor
- Namuna: `example/main.dart`

Flutter'chilarga `SDKDownloads.tsx` orqali `.tar.gz` yoki GitHub link.

---

## Bosqich 5 — Sandbox + Monitoring

- **Sandbox:** `api-gateway`da `environment='sandbox'` kalitlar uchun alohida test ma'lumotlar (mock clinics, mock AI response, mock Med Coin balance, mock payment success). Real DB'ga yozmaydi.
- **Monitoring cron:** yangi edge function `api-health-monitor` — har 5 daqiqada `api_request_logs`ni tekshiradi:
  - Error rate > threshold → admin'ga email + telegram alert
  - Avg latency > threshold → alert
  - Suspicious token usage (100+ 401 in 5 min) → alert
- `pg_cron` bilan schedule

---

## Bosqich 6 — Xavfsizlik qatlami

- **Request Signature (HMAC):** hamkorlar uchun optional — `X-Signature: HMAC-SHA256(secret, timestamp+body)` header validation
- **Refresh Token rotation** — Supabase auth allaqachon qiladi, hujjatlashtiramiz
- **CORS whitelist** — `api_partners.allowed_domains` (mavjud) qat'iy tekshiruv
- **Audit log:** har bir API Center action `audit_logs`ga yoziladi (kim yaratdi/revoke qildi kalit)
- **security scan:** yangi endpointlar uchun input validation (Zod har bir handler'da)

---

## Texnik tafsilotlar

```text
Loyiha strukturasi:
├── supabase/
│   ├── migrations/            → api_endpoints, api_oauth_clients, api_sdk_versions, api_monitoring_alerts
│   └── functions/
│       ├── api-gateway/       → kengaytirilgan (auth+user+ai+emr+payments+notif+maps)
│       └── api-health-monitor/ → yangi, cron bilan
├── src/
│   ├── pages/
│   │   ├── admin/APICenterPage.tsx    → /admin/api-center
│   │   └── DeveloperPortalPage.tsx    → /developers
│   └── components/admin/api/  → 18 ta komponent
├── sdk/flutter/med1_api/      → Dart package
└── public/openapi.json        → to'liq spec
```

**Ish tartibi (har bosqich alohida xabar):**
1. **1-xabar:** Bosqich 1 (DB migration + gateway kengaytirish)
2. **2-xabar:** Bosqich 2 (Super Admin UI — API Management Center)
3. **3-xabar:** Bosqich 3 (Developer Portal + OpenAPI)
4. **4-xabar:** Bosqich 4 (Flutter SDK)
5. **5-xabar:** Bosqich 5+6 (Sandbox, Monitoring, Security)

Har bosqich mustaqil ishlaydi va build/test bilan tekshiriladi. Umumiy hajm katta — taxminan 40-50 ta yangi/o'zgartirilgan fayl.

**Muhim eslatma:** Barcha to'lov (Stripe/Click/Payme), AI (Gemini/Lovable AI), va notifications (Telegram/Email) — allaqachon ishlaydigan edge function'larga proxy qilamiz. Dublikat logic yozmaymiz.

---

**Tasdiqlang va men Bosqich 1'dan boshlayman.**
