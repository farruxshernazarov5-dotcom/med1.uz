
# 🤝 MED-ALL AI Referral & Partner Reward System

Katta modul. Bir nechta bosqichda yetkazib beriladi (har bir bosqich alohida message), shunda har biri stabil va testlanadigan bo'ladi.

---

## 🗄️ BOSQICH 1 — Database Foundation (1 migration)

Yangi jadvallar (hammasi RLS yoqilgan, `search_path = public`):

- **referral_codes** — `owner_id`, `code` (unique), `kind` (org|patient), `org_role`, `total_uses`, `total_rewards_credits`, `total_rewards_months`, `is_active`
- **referrals** — `code_id`, `referrer_id`, `referred_user_id`, `referred_org_role`, `status` (pending|registered|subscribed|approved|rejected|fraud), `subscription_tier`, `reward_credits`, `reward_months`, `approved_at`, `meta jsonb`
- **referral_rewards_ledger** — `user_id`, `referral_id`, `kind` (credits|months|ai_credits), `amount`, `applied_to` (subscription|ai_subscription|wallet), `balance_before/after`, `notes`
- **referral_wallet** — `owner_id` unique, `credits_balance`, `ai_credits_balance`, `lifetime_earned`, `lifetime_spent`
- **referral_promo_codes** — admin yaratgan kodlar: `code`, `discount_pct`, `bonus_months`, `bonus_credits`, `applicable_tiers jsonb`, `max_uses`, `valid_until`, `is_active`
- **referral_tiers** — gamification: `level` (bronze|silver|gold|platinum|vip), `min_referrals`, `bonus_multiplier`, `perks jsonb`
- **referral_notifications** — in-app notif: `user_id`, `type`, `title`, `body`, `is_read`
- **referral_settings** (singleton) — admin sozlamalari: base reward per tier (basic/premium/ai), self-referral block, IP/device limit
- **referral_fraud_log** — fraud aniqlangan eventlar

DB funksiyalari:
- `generate_referral_code(owner_id)` — unique 8-belgili kod
- `apply_referral_reward(referral_id)` — SECURITY DEFINER, ledgerga yozadi + wallet/obuna yangilaydi
- `get_referral_stats(owner_id)` — dashboard uchun aggregated stats
- `compute_referral_tier(owner_id)` — joriy level qaytaradi
- Trigger: `tenant_subscriptions` INSERT/UPDATE → referral status `subscribed` → `apply_referral_reward()`

---

## 🧩 BOSQICH 2 — Universal Frontend Components

`src/components/referral/` papkasi:

- **ReferralPanel.tsx** — universal tab (har qanday dashboardga import qilinadi). Quyidagi sub-tablardan iborat: Overview / My Code & Link / Invited / Rewards / Leaderboard / Guide
- **ReferralOverviewCard.tsx** — KPI: total invites, conversion %, earned credits, active months
- **ReferralCodeCard.tsx** — kod + `med1.uz/register?ref=CODE` link, Copy/Share/QR/Telegram tugmalari
- **ReferralInvitedTable.tsx** — taklif qilingan tashkilotlar (status, tier, reward)
- **ReferralWalletCard.tsx** — credits, ai_credits balans + "Apply to subscription" tugmasi
- **ReferralLeaderboard.tsx** — top 10 referrers (anonim, faqat org_role + count)
- **ReferralTierBadge.tsx** — bronze/silver/gold/platinum/vip badge + progress bar
- **ReferralGuide.tsx** — animated onboarding (qadamlar + misol)
- **ReferralShareModal.tsx** — Telegram/WhatsApp/QR/Copy share opsiyalari
- **ReferralAIRecommendation.tsx** — AI tavsiyalari widget (kim taklif qilish, conversion ehtimoli)
- **hooks/useReferral.ts** — barcha data fetching

Design: cinematic dark + `.glass-dark` + `.ring-neon` + `.btn-magnetic` + futuristic primitives (mavjud).

---

## 🌐 BOSQICH 3 — Registration Flow

- **src/pages/AuthPage.tsx / org registration pages** — `?ref=CODE` URL paramini o'qiydi, localStorage'ga saqlaydi (`med1.referralCode`)
- Yangi user signupda `handle_new_user` trigger meta'dan `referral_code` oladi → `referrals` jadvaliga `pending` yozadi
- Org registration submitda referral code attach qilinadi
- **/register?ref=CODE** route handler

---

## 🎯 BOSQICH 4 — Dashboard Integration

Universal `ReferralPanel` quyidagilarga "Referrals" tab sifatida qo'shiladi:

1. ClinicDashboard
2. DentalDashboard
3. DiagnosticsDashboard
4. CosmetologyDashboard
5. PharmacyDashboard
6. MaternityDashboard
7. VendorDashboard
8. DoctorDashboard
9. PatientDashboard (sodda variant — faqat code/link + earned AI credits)
10. AdminDashboard — to'liq admin paneli

---

## 👑 BOSQICH 5 — Admin Control Panel

`src/components/admin/ReferralAdmin.tsx`:

- Barcha referrallar ro'yxati (filter: status, sana, role)
- Approve / Reject / Mark as fraud
- **PromoCodes manager** — yaratish/o'chirish, discount %, bonus oy/credits, applicable tiers, valid_until
- **Reward settings** — har bir subscription tier uchun bonus matrix (basic/premium/ai_pro)
- **Fraud detection log** — IP/device duplicate, self-referral attempts
- **Analytics dashboard** — Recharts: daily new referrals, conversion funnel, top referrers, revenue impact

---

## 🤖 BOSQICH 6 — Edge Functions

`supabase/functions/`:

- **referral-apply** — referral kod tasdiqlash, fraud check (IP/device/email duplicate)
- **referral-ai-recommend** — Gemini 3 Flash: kontaktlar/region asosida kim taklif qilish va conversion ehtimoli (%)
- **referral-notify** — Telegram + in-app + email triggerlari (mavjud notify infra orqali)
- **referral-leaderboard** — keshlangan top-10 ro'yxat

CORS manual headers, `verify_jwt` standart, Zod validation.

---

## 🎮 BOSQICH 7 — Gamification & Notifications

- **Tiers** — Bronze (1-4), Silver (5-9), Gold (10-24), Platinum (25-49), VIP (50+) — har biri reward multiplier (1.0x → 1.5x)
- **Achievements/Badges** — "First Invite", "Conversion King", "VIP Partner"
- **In-app notification bell** — yangi referral, reward, level-up
- **Smart toast** — real-time Supabase channel orqali

---

## 📜 BOSQICH 8 — Legal & Guide

- **src/pages/ReferralTermsPage.tsx** (`/referral-terms`) — reward policy, anti-fraud rules, bonus shartlari (UZ/RU/EN)
- **src/pages/ReferralProgramPage.tsx** (`/referral`) — public marketing sahifa
- Onboarding tutorial — ReferralGuide ichida animated qadamlar
- Footerga link

---

## 📱 BOSQICH 9 — Mobile/Share

- Native Web Share API + Telegram deep link (`https://t.me/share/url?...`)
- QR generator (`qrcode` npm — yangi dep)
- Mobile-optimized share modal

---

## 🔒 BOSQICH 10 — Security & Fraud

- Self-referral block (DB constraint + trigger)
- Same email/phone duplicate block
- IP/device fingerprint log (`referrals.meta`)
- Manual admin override (approve/reject)
- Reward faqat `subscribed` status'dan keyin auto-apply
- Rate limit edge funcda

---

## ⚙️ Texnik tafsilotlar

- **Kutubxonalar**: `qrcode` (yangi), mavjud Recharts/Framer/Supabase/Lovable AI
- **Realtime**: `referrals`, `referral_notifications`, `referral_wallet` jadvallari uchun `supabase_realtime` publication
- **Indexlar**: `referrals(referrer_id, status)`, `referral_codes(code)`, `referral_notifications(user_id, is_read)`
- **RLS**: har bir user faqat o'z referrallari/wallet/notif'ini ko'radi. Admin — `has_role(uid, 'admin')`. Leaderboard — barcha auth user uchun anonim view.
- **Memory yangilanadi**: yangi `mem://features/referral-system` yoziladi va index'ga qo'shiladi.

---

## 🚦 Yetkazib berish tartibi

Ushbu rejani tasdiqlasangiz, men Bosqich 1 (Migration) bilan boshlayman — siz tasdiqlaysiz, keyin frontend qismlarini bosqichma-bosqich, har birini ishonchli holatda yetkazaman. Hammasini bir yo'la qilish risk va kredit-jihatdan optimal emas.

**Boshlaymizmi? "Ha, bosqich 1 dan boshla" desangiz, migration yozaman.**
