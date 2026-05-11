## Premium Monetization & Discount Engine

Build a unified "Discounts & Premium Features" module that surfaces in every dashboard, shows locked premium perks to all users, and unlocks based on their SaaS subscription tier.

### Architecture

Reuse existing infrastructure:
- `useSaasPlan(moduleId)` — already returns tier/features/limits per module
- `ModuleLock` + `UpgradeModal` — already handle the "click locked → upgrade popup" flow
- `tenant_subscriptions` + `saas_plans` — tier definitions live here
- Click/Payme/Stripe — already integrated in `/pricing`

No new payment integration needed — the upgrade button routes to existing `/pricing?module=...`.

### New database tables

1. **`premium_perks`** — admin-managed catalog of premium offerings
   - `id`, `module_id` (clinic/dental/...), `tier_required` (starter/pro/enterprise), `category` (discount/bonus/cashback/promo/ai/vip), `title`, `description`, `icon`, `value_text` (e.g. "50%"), `is_active`, `display_order`
2. **`promo_codes`** — promo code redemption
   - `id`, `code` (unique), `module_id`, `tier_required`, `discount_pct`, `valid_until`, `max_uses`, `used_count`, `is_active`
3. **`promo_redemptions`** — log
   - `id`, `user_id`, `promo_code_id`, `redeemed_at`

RLS: public read on `is_active` perks/codes; admin-only writes; users can read their own redemptions.

### New components

```
src/components/premium/
  PremiumPerksPanel.tsx      # Main container — tabs: Chegirmalar | Bonuslar | Cashback | Promo
  PerkCard.tsx               # Single perk card with lock overlay + glow
  PromoCodeRedeem.tsx        # Input field to redeem promo codes
  PremiumBenefitsPreview.tsx # "What you get" preview block
  UpgradeNudge.tsx           # AI-style recommendation banner
src/hooks/
  usePremiumPerks.ts         # Fetch perks + check unlock status via useSaasPlan
src/components/admin/
  AdminPremiumPerks.tsx      # CRUD for perks + promo codes (new admin tab)
```

### Integration points

Add `<PremiumPerksPanel moduleId="..." />` as a new sidebar tab "💎 Premium" in:
- ClinicDashboard, DentalDashboard, DiagnosticsDashboard, CosmetologyDashboard, PharmacyDashboard, MaternityDashboard, BloodBankDashboard, DoctorDashboard, PatientDashboard

For PatientDashboard, `moduleId="clinic"` (patients see clinic-tier perks they can claim).

### Lock/unlock logic

```ts
const { tier, isFeatureAllowed } = useSaasPlan(moduleId);
const TIER_RANK = { free:0, starter:1, pro:2, enterprise:3 };
const isUnlocked = TIER_RANK[tier] >= TIER_RANK[perk.tier_required];
```

Locked card: blurred value, lock icon overlay with pulse animation, gradient border, click → `UpgradeModal`.
Unlocked card: full content, "Faollashtirish" button, premium glow.

### UI/UX details

- Premium glow: `shadow-[0_0_30px_hsl(var(--primary)/0.4)]` + animated gradient border
- Lock animation: Framer Motion pulse on lock icon
- Countdown for limited offers (using `valid_until`)
- Trial CTA: "7 kun bepul sinab ko'ring" → routes to `/pricing`

### AI Recommendation

Lightweight rule-based (no extra edge function needed):
- If user is `free` and has used ≥80% of any limit → recommend `starter`
- If `starter` and views perks 3+ times → recommend `pro`
- Show as `UpgradeNudge` banner at top of `PremiumPerksPanel`

### Admin panel

New tab "💎 Premium" in `AdminDashboard`:
- CRUD perks (per module, per tier)
- CRUD promo codes
- Toggle active/inactive
- View redemption stats

### Out of scope

- No new payment provider (Click/Payme/Stripe already wired via `/pricing`)
- No new subscription logic (uses existing `tenant_subscriptions`)
- No mobile app changes beyond responsive Tailwind

### Files

**New:** 4 components in `src/components/premium/`, `src/hooks/usePremiumPerks.ts`, `src/components/admin/AdminPremiumPerks.tsx`, 1 migration

**Edited:** 9 dashboard files (add Premium sidebar item + tab), `AdminDashboard.tsx` (add admin tab)
