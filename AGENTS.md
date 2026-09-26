# Project Architecture Rules

- Keep `EMEDINFO_BOT_TOKEN` (interactive Med1.uz patient/business bot) isolated from `TELEGRAM_BOT_TOKEN` (legacy OTP, security and payment notifications), because existing authentication and alert delivery must not regress.
- Telegram menus open the canonical `https://med1.uz` routes as Mini App pages instead of duplicating website business logic, so web and bot always use the same features and data.
- Mobile (Capacitor) support lives in `src/lib/nativeApp.ts` + `src/components/mobile/*`; every native plugin call is dynamically imported and no-ops on web, so the deployed website keeps working without native APIs.
- Fixed bottom-anchored overlays (cookie/geo banners, floating dock) must clear the mobile bottom navigation by using `bottom-16`/`bottom-20` with an `lg:` reset.
