# Project Architecture Rules

- Keep `EMEDINFO_BOT_TOKEN` (interactive Med1.uz patient/business bot) isolated from `TELEGRAM_BOT_TOKEN` (legacy OTP, security and payment notifications), because existing authentication and alert delivery must not regress.
- Telegram menus open the canonical `https://med1.uz` routes as Mini App pages instead of duplicating website business logic, so web and bot always use the same features and data.