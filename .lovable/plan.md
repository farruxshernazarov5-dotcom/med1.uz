# AI Analytics & Usage Intelligence Center — Bosqichma-bosqich reja

Modul Super Admin uchun real ma'lumotlardan (mock emas) hisoblanadigan to'liq AI monitoring tizimi.

Hozir `ai_usage` jadvalida atigi 5 ustun bor (`user_id`, `service_id`, `used_at`, `tokens_used`, `cost_credits`). Kanal, latency, status, OpenAI/Gemini xarajati yo'q. Shuning uchun avval **fundament** quramiz, keyin UI.

---

## BOSQICH 1 — Ma'lumotlar fundamenti (DB + Edge logging)

**Maqsad:** Har bir AI so'rov to'liq kontekst bilan yozilishi.

1. `ai_usage` jadvaliga ustunlar qo'shish:
   - `channel` (`web` | `hambi` | `telegram` | `api` | `mobile_android` | `mobile_ios`)
   - `status` (`success` | `error` | `timeout` | `rate_limited`)
   - `latency_ms` (int)
   - `model` (text — `gemini-3-flash-preview` va h.k.)
   - `prompt_tokens`, `completion_tokens` (int)
   - `cost_usd` (numeric — model narxidan hisoblangan haqiqiy $)
   - `error_code`, `error_message` (text, nullable)
   - `region` (text — IP/profil hududidan)
   - `request_id` (uuid — debug uchun)
2. Indekslar: `(service_id, used_at DESC)`, `(channel, used_at DESC)`, `(status, used_at DESC)`.
3. `supabase/functions/_shared/ai-access.ts` ichida `logAiUsage(...)` helper yangilanadi — barcha yangi maydonlarni qabul qiladi, kanalni `X-Channel` header'dan o'qiydi.
4. 14 ta AI edge function (`ai-doctor-chat`, `ai-radiology`, `symptom-checker`, `ai-report-analysis`, va h.k.) `logAiUsage` chaqirig'ini yangilaydi: latency o'lchaydi, status/error yozadi, model + cost qo'shadi.
5. `src/lib/aiClient.ts` (yangi yoki mavjudini yangilash) — frontend har doim `X-Channel: web|hambi|mobile_*` headerini yuboradi (`Capacitor.isNativePlatform()` + Hambi WebView aniqlash).

## BOSQICH 2 — Server-side aggregation funksiyalari

**Maqsad:** Dashboard 100k+ qatordan tez yuklanishi.

`SECURITY DEFINER` SQL funksiyalari (faqat admin chaqira oladi):

- `analytics_overview(_from, _to)` → KPI kartalar (jami, bugungi, haftalik, oylik, success %, avg latency).
- `analytics_by_service(_from, _to)` → har bir service uchun count, tokens, cost, avg latency.
- `analytics_by_channel(_from, _to)` → kanal kesimida.
- `analytics_revenue(_from, _to)` → `credit_history` + `ai_payments` + `platform_payments` JOIN.
- `analytics_top_users(_from, _to, _limit)` → top Med Coin sarflagan foydalanuvchilar.
- `analytics_timeseries(_from, _to, _granularity)` → soat/kun/oy bo'yicha trend (Recharts uchun).
- `analytics_by_region(_from, _to)` → hudud kesimi.

Hammasi `has_role(auth.uid(), 'admin')` tekshiradi.

## BOSQICH 3 — UI: AI Analytics Center (Faza 1 dashboard)

- Yangi route: `/admin/ai-analytics` (faqat admin).
- AdminDashboard sidebar/menyusiga "📊 AI Analytics Center" qo'shish.
- Komponentlar (`src/components/admin/analytics/`):
  - `AnalyticsHeader` — sana oralig'i pikkeri (Bugun / 7 kun / 30 kun / 90 kun / 1 yil / Custom).
  - `KpiCards` — 8 ta jonli KPI karta.
  - `ServicesTable` — 14 AI xizmat reytingi (sortable).
  - `ChannelBreakdown` — donut chart (Web / Hambi / Telegram / API / Mobile).
  - `UsageTimeline` — Recharts area chart.
  - `RevenuePanel` — daromad va Med Coin grafiklari.
  - `TopUsersList` — top 10 foydalanuvchilar.
- Dizayn: mavjud `bg-grid-tech`, `glass-dark`, KPI uchun `GlowCard` (futuristik design system).
- Real-time: 60s `refetchInterval` (TanStack Query) + Supabase Realtime `ai_usage` INSERT subscription "Live Counter" uchun.

## BOSQICH 4 — Kengaytmalar

- **Hududlar:** Google Maps heatmap (`/admin/ai-analytics/regions`).
- **Token / OpenAI xarajatlari:** model narx jadvali (`ai_model_pricing`) + `cost_usd` aggregation.
- **Top Med Coin foydalanuvchilar:** `credit_history` JOIN.
- **AI BI tavsiyalar:** Lovable AI Gateway orqali kunlik insight generatsiya (`ai-bi-insights` edge function, kunlik cron).
- **Alertlar:** mavjud `security_debug_log` + `security-notify` infratuzilmasidan foydalanish (token spike, error spike, daromad pasayishi).

## BOSQICH 5 — Export va polish

- PDF (jsPDF, mavjud `downloadContractPDF.ts` patterni), Excel (xlsxwriter / SheetJS), CSV export.
- Dark/Light mode tekshiruv (mavjud `next-themes` ishlatamiz).
- Investor-ready KPI snapshot sahifasi (`/admin/ai-analytics/snapshot`) — bitta sahifada hammasi, PDF ga eksport.

---

## Texnik tafsilotlar

**Yangi fayllar (taxminiy):**
- `supabase/migrations/<ts>_ai_analytics_foundation.sql` — `ai_usage` ALTER + indexlar + RPC funksiyalar.
- `supabase/functions/_shared/ai-access.ts` — `logAiUsage` kengaytirilgan.
- `supabase/functions/_shared/ai-cost.ts` — model narxi → USD hisoblash.
- `supabase/functions/ai-bi-insights/index.ts` — kunlik AI tavsiyalar.
- `src/lib/aiClient.ts` — channel header injection.
- `src/pages/admin/AIAnalyticsPage.tsx`
- `src/components/admin/analytics/*` (8-10 komponent)
- `src/hooks/useAdminAnalytics.ts` — TanStack Query hooklari.

**O'zgartiriladi:** 14 ta AI edge function (logging chaqiruvi), `App.tsx` (route), `AdminDashboard` (menyu).

**RLS:** `ai_usage` SELECT faqat o'z qatorlari uchun (mavjud), admin uchun `has_role` orqali aggregation funksiyalarda.

---

## Tasdiq

Bu rejani tasdiqlasangiz, **Bosqich 1**dan (DB fundament + edge logging) boshlayman — bu yagona migratsiya + edge function yangilanishlari, taxminan 1 katta iteratsiya. Keyingi bosqichlar har biri alohida iteratsiyada quriladi va siz har bosqichdan keyin natijani ko'rasiz.

Boshlaymizmi Bosqich 1'dan, yoki rejaga o'zgartirish kiritamizmi?
