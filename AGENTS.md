# Project Architecture Rules

- Keep `EMEDINFO_BOT_TOKEN` (interactive Med1.uz patient/business bot) isolated from `TELEGRAM_BOT_TOKEN` (legacy OTP, security and payment notifications), because existing authentication and alert delivery must not regress.
- Telegram menus open the canonical `https://med1.uz` routes as Mini App pages instead of duplicating website business logic, so web and bot always use the same features and data.
- Mobile (Capacitor) support lives in `src/lib/nativeApp.ts` + `src/components/mobile/*`; every native plugin call is dynamically imported and no-ops on web, so the deployed website keeps working without native APIs.
- The patient mobile shell owns global navigation, AI sheets, connectivity feedback, and the mobile services hub so shared web pages remain unchanged.
- Mobile service navigation uses `src/data/mobileServiceCatalog.ts` as the single route inventory shared by the catalogue, home shortcuts, and AI hub, preventing link drift.
- Mobile service photography is assigned through `src/data/mobileServiceImages.ts` and consumed from the shared catalogue, so every mobile surface uses the same existing site image.
- Mobile service education is presented through the shared catalogue detail overlay, so every service keeps one visual explanation and canonical destination.
- Native deep links and last-screen restoration accept only allowlisted internal Med1 routes, so external input cannot become an open redirect.
- Mobile directory favorites are account-backed in `mobile_favorites`; never cache authenticated favorites or patient data in local storage.
- Fixed bottom-anchored overlays (cookie/geo banners, floating dock) must clear the mobile bottom navigation by using `bottom-16`/`bottom-20` with an `lg:` reset.
- Native medication/appointment reminders and biometric medical-card lock live in `src/lib/nativeHealth.ts`; reminders are OS local notifications only (no web storage of patient data), and the biometric preference is just an on/off flag.
