# Reja — Security Center + AI Token Limit

So‘rov juda yirik (8+ alohida feature, ~50 fayl ta'siri). Bir javobda hammasini qilish xavfli — sifat tushib ketadi va regressiya bo‘lishi mumkin. Shuning uchun **4 bosqich** qilamiz. Har bosqichdan keyin tekshirasiz, keyin keyingisiga o'tamiz.

---

## Bosqich 1 — Security Center: Backend (DB + Edge Functions)

**Maqsad:** Server tomonda log saqlash, retention, notification infratuzilmasi.

1. **Migration:** yangi jadvallar
   - `security_debug_log` (server-side log: id, scope, level, message, query, column_name, endpoint, user_id, metadata, created_at)
   - `security_notification_settings` (admin id, email_enabled, telegram_enabled, error_only)
   - `security_log_retention` (days = 30 default, updated_by, updated_at)
   - RLS: faqat `admin` rolga ko'rinadi; service_role to'liq.
   - GRANT + RLS policies (admin SELECT/INSERT, service_role ALL).
2. **Edge function `security-notify`**: error-level entry kelganda email (notify.med1.uz) + Telegram (@Med1uzInfoBot) yuboradi.
3. **Edge function `security-log-purge`**: retention_days dan eski yozuvlarni o'chiradi. pg_cron har kuni 03:00 chaqiradi.
4. **Edge function `security-log-query`**: server-side pagination (page, pageSize, filters: from/to/level/scope/column). 1000+ row uchun tez.

## Bosqich 2 — Security Center: Frontend (Drawer + Pagination + Purge UI)

1. `FallbackDetailDrawer.tsx`: banner'ga "Tafsilotlar" tugmasi — endpoint, SQL/query payload, korrelyatsiyalangan audit/debug yozuvlari ko'rsatiladi.
2. `SecurityCenterModule.tsx`:
   - Debug/audit logni `security-log-query` orqali server-side paginatsiya bilan ko'rsatish.
   - Filterlar serverga uzatiladi.
   - "Retention sozlash" (kunlar) + "Hozir tozalash" tugmasi (super admin).
   - "Notification sozlamalari" tab: email/telegram toggle.

## Bosqich 3 — AI: Qat'iy 150 Token Cap

1. `supabase/functions/_shared/ai-access.ts`:
   - `MAX_OUTPUT_TOKENS_HARD_CAP = 150`
   - `TIER_MODELS` barcha tier uchun `maxTokens: 150`
   - `CONCISE_DIRECTIVE` 50–150 token qoidasiga qayta yoziladi (sizning prompt matningiz).
2. Barcha 14 ta edge function (`ai-doctor-chat`, `ai-dietolog`, `ai-radiology`, `ai-report-analysis` v.b.) — `max_completion_tokens: 150` ekanini tekshirish (allaqachon `access.maxTokens` ishlatadi, faqat yangi qiymat avtomatik tarqaladi).
3. Response headerga `X-Med1-AI-Output-Tokens` qo'shish (real sarflangan).
4. Server-side: 150 dan oshsa `security_debug_log`ga `warn` yozuv + admin alert.

## Bosqich 4 — Token Monitoring UI

1. Har AI javob ostida `TokenCounter` komponenti: input/output/jami token, sarflangan Med Coin.
2. Foydalanuvchi dashboardiga `TokenUsageCard`: bugungi/oylik token, xizmat bo'yicha breakdown.
3. Super Admin paneliga `AdminTokenMonitor`: jami sarf, xizmat/foydalanuvchi bo'yicha, OpenAI $ taxminiy xarajat, top-5 qimmat xizmatlar (Recharts).
4. Cache: bir xil so'rov uchun (user+service+hash(prompt)) 1 soat localStorage cache.

---

## Texnik tafsilotlar

- **Notification kanal:** mavjud `send-transactional-email` (email) + `telegram-notify` (Telegram). Yangi template: `security-alert.tsx`.
- **Retention default:** 30 kun (siz tanladingiz). Admin UI orqali 7–365 kun oralig'ida o'zgartirish.
- **Paginatsiya:** default 50/sahifa, max 200.
- **Token cap:** 150 majburiy barcha 14 xizmatga (siz tasdiqlagansiz).
- **Cache:** localStorage + server tomonda `ai_response_cache` jadvali (ixtiyoriy, bosqich 4 oxirida).

## Tasdiqlang

Reja ma'qulmi? Tasdiqlasangiz **Bosqich 1**dan boshlayman (DB + 3 ta edge function). Har bosqich ~1 javobda yakunlanadi.
