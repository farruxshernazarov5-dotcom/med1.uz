# Project Architecture Rules

- Keep `EMEDINFO_BOT_TOKEN` (interactive Med1.uz patient/business bot) isolated from `TELEGRAM_BOT_TOKEN` (legacy OTP, security and payment notifications), because existing authentication and alert delivery must not regress.
- Telegram menus open the canonical `https://med1.uz` routes as Mini App pages instead of duplicating website business logic, so web and bot always use the same features and data.
- Mobile (Capacitor) support lives in `src/lib/nativeApp.ts` + `src/components/mobile/*`; every native plugin call is dynamically imported and no-ops on web, so the deployed website keeps working without native APIs.
- The patient mobile shell owns global navigation, AI sheets, connectivity feedback, and the mobile services hub so shared web pages remain unchanged.
- Mobile service navigation uses `src/data/mobileServiceCatalog.ts` as the single route inventory shared by the catalogue, home shortcuts, and AI hub, preventing link drift.
- Mobile service cards use `mobileServiceImages.ts`, while each educational detail uses four service-specific generated frames and copy from `mobileServiceStories.ts`, preventing generic visual reuse.
- Mobile service education is presented through the shared catalogue detail overlay, so every service keeps one visual explanation and canonical destination.
- Native deep links and last-screen restoration accept only allowlisted internal Med1 routes, so external input cannot become an open redirect.
- Mobile directory favorites are account-backed in `mobile_favorites`; never cache authenticated favorites or patient data in local storage.
- Fixed bottom-anchored overlays (cookie/geo banners, floating dock) must clear the mobile bottom navigation by using `bottom-16`/`bottom-20` with an `lg:` reset.
- Native medication/appointment reminders and biometric medical-card lock live in `src/lib/nativeHealth.ts`; reminders are OS local notifications only (no web storage of patient data), and the biometric preference is just an on/off flag.
- Patient visits and lab orders are aggregated across every booking module only via `src/lib/patientRecords.ts`, so mobile screens, reminders and alerts never disagree about what a patient has booked.
- The mobile "Foydali maslahatlar" hub reads its menus, frames and phrases only from `src/data/mobileTipsCatalog.ts`, keeping cards, stories and onboarding in sync.
- Mobile Profile uses `mobileProfileCatalog.ts` for menu identity and three generated photo frames; reuse existing account-backed patient components in profile sections rather than duplicating medical or payment logic.
- Mobile Profile security exposes real Auth password updates and other-session sign-out; never present mock devices or mock login history as account security records.
- Auth return paths use `authDestination.ts` to retain internal appointment/dashboard queries and reject external redirects and sign-in loops.
- Lab aggregation exposes source failures separately from empty results; readiness alerts must not advance their checkpoint after a failed read.
- The native live-site wrapper loads canonical HTTPS `med1.uz`, not a sandbox preview; hosted changes require publication and native OAuth must not use fabricated callback schemes.
