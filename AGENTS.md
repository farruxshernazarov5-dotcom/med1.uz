# Project Architecture Rules

- Click MiniApp startup and checkout adaptation live in `src/lib/clickMiniApp.ts`; activate only after the official SDK native handshake, keep Click web-session separate from Med1 auth and require a dedicated server-issued MiniApp Service ID, because the CDN also loads in normal browsers and website billing IDs cannot be reused. Hosting must inject validated session metadata per request without shared caching; see `docs/CLICK_MINIAPP.md`.
- The `/click` entry reuses existing Med1 routes, authentication, and `MOBILE_AI_SERVICES` for grouped AI navigation (plus the orchestrator), because duplicate catalogues and business flows would diverge; its partnership favicon is route-scoped so other Med1 pages retain their branding.
- `/admin/partners/click` owns Click-only attribution and reuses `ClickTestPanel` behind an explicit operations action; `click_partner_requests` stores owner-scoped support requests and admin replies, distinguishes unverified client SDK reports from server QR claims, and never stores Click sessions or QR credentials. Never reuse HAMBI's synthetic statistics or equate attribution/QR claims with Click identity verification.
- QR account pairing tokens are server-issued, single-use login credentials with five-minute expiry; clients may only read their own status, never insert tokens for another account.
- MED ALL voice alerts use `voiceNotify.ts` with explicit opt-in and session deduplication; Health Connect imports tolerate individual denied data types without pretending a watch connection was verified.
- Eskiz transactional SMS must render provider `original_text` against its approved matching pattern and verify authoritative events plus patient consent; generic client-writable notifications must never authorize paid SMS.
- All Eskiz send paths validate final text with `assertFinalSmsText` before the provider request; transactional rendering also requires an exact parameter count, preventing unresolved placeholders from reaching recipients.
- Eskiz OTP delivery reads the approved OTP template from the provider and uses the shared approved-pattern validator, because a stale local secret must never replace approved wording or send an unchanged sample code.
- Authorized transactional dispatchers use `sendApprovedTransactionalSms` for all mapped events; `eskiz-admin` only previews provider-backed text and parameter counts, keeping diagnostics separate from paid dispatch.

- Phone SMS login uses the `eskiz-otp` function (server-generated hashed OTP in service-only `sms_otp`, cooldown/attempt limits) and sends only to numbers already on a profile, then signs into that existing account via magic-link token like Telegram OTP; Telegram OTP stays as an alternative, so existing profiles are never duplicated.

- Keep `EMEDINFO_BOT_TOKEN` (interactive Med1.uz patient/business bot) isolated from `TELEGRAM_BOT_TOKEN` (legacy OTP, security and payment notifications), because existing authentication and alert delivery must not regress.
- Telegram menus open the canonical `https://med1.uz` routes as Mini App pages instead of duplicating website business logic, so web and bot always use the same features and data.
- Mobile (Capacitor) support lives in `src/lib/nativeApp.ts` + `src/components/mobile/*`; every native plugin call is dynamically imported and no-ops on web, so the deployed website keeps working without native APIs.
- Native deep links and last-screen restoration accept only allowlisted internal Med1 routes, so external input cannot become an open redirect.
- Mobile directory favorites are account-backed in `mobile_favorites`; never cache authenticated favorites or patient data in local storage.
- Native medication/appointment reminders and biometric medical-card lock live in `src/lib/nativeHealth.ts`; reminders are OS local notifications only (no web storage of patient data), and the biometric preference is just an on/off flag.
- Patient visits and lab orders are aggregated across every booking module only via `src/lib/patientRecords.ts`, so mobile screens, reminders and alerts never disagree about what a patient has booked.
- Auth return paths use `authDestination.ts` to retain internal appointment/dashboard queries and reject external redirects and sign-in loops.
- Lab aggregation exposes source failures separately from empty results; readiness alerts must not advance their checkpoint after a failed read.
- The native app loads bundled `dist` files (no `server.url`), so app changes require a rebuild + `npx cap sync`; native Google/Microsoft sign-in runs in the system browser via `/app-bridge` and returns only through the manifest-registered, package-pinned `uz.medall.app://app-auth` link with a one-time state nonce (`src/lib/nativeOAuth.ts`), because providers block WebView OAuth.
- Mobile cash balances are server-owned in `cash_wallets` with an immutable ledger; only confirmed provider payments or guarded RPCs may change them, preventing client-side balance forgery.
- Mobile classifieds use one moderated catalogue and keep paid Med1 TOP placements separate from organic listings, preserving the platform's sponsored-content rule.
- Saved native logins live only in the OS keystore via `src/lib/nativeCredentials.ts` behind a biometric check; web storage keeps just an on/off flag.
- Native Google sign-in uses the OS account picker via `src/lib/nativeGoogle.ts` (ID token + hashed nonce → signInWithIdToken); the `/app-bridge` browser flow is only a fallback for old APKs, because browser hand-off left users stranded in Chrome.
- Native Click/Payme checkouts open through `openCheckout()` in `nativeApp.ts` (in-app browser, emits `med1:checkout-closed`), so payments never leave the app and balances refresh on return.
- Referral credit → so‘m conversion runs only in the `convert_referral_credits_to_cash` RPC using the admin-set `referral_settings.credit_to_uzs` rate, so the client can never choose the rate.
- Realtime channel names must be unique per subscriber (append a random suffix), because Supabase returns an already-subscribed channel for a reused name and throws "cannot add postgres_changes callbacks after subscribe()".
- Never return a Capacitor plugin proxy from an async function (wrap it as `{ p: Plugin }`), because Promise resolution probes `.then` on the proxy and Android throws "Plugin.then() is not implemented".
- Account devices live in `user_devices` (random per-install key, `src/lib/userDevices.ts`); new-device, classified and Med1 TOP status alerts are written to `notifications` by database triggers so every feed and alerter sees them.
- Screenshot blocking goes through `useSecureScreen()` in `src/lib/secureScreen.ts` (ref-counted, native only), so sensitive screens opt in without touching the website.
- Reminder sounds live in `resources/android/raw` and each sound has its own Android channel, because Android fixes a channel's sound when it is created.
- `src/components/mobile/` and `src/lib/vitals/` have their own `AGENTS.md`; read them before changing files there.
- Vital AI PDF reports are registered in `vital_reports` (code + SHA-256 only) and verified publicly via the `verify_vital_report` RPC at `/verify/vital/:code`, so QR checks never expose patient health data.
- Every `notifications` insert is forwarded to the linked Telegram chat by a database trigger calling `emedinfo-bot/notify` (job secret + `telegram_sent_at` once-only flag), so web, app and Telegram alerts never diverge and alerts cannot be forged or replayed.

- AI PDF exports retain fixed columns without inventing missing results; Vital PDF renders only actual Markdown tables as tables and keeps narrative blocks as prose, so measurements and advice remain visually distinct.
- Platform doctor conversations use request-linked `platform_doctor_messages` with participant-only RLS and server-set sensitive flags; external doctor appointment chat remains separate because their doctor foreign keys differ.
