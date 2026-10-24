# Eskiz SMS status and safe mapping

Live API check on 2026-10-24 rejected the OTP send with the provider moderation error. Seven `service` templates are approved, but none is OTP. Do not repurpose subscription or appointment messages for login.

`_shared/transactional-sms.ts` maps those seven provider IDs to typed events. It renders `original_text` (%s), validates the result against `template` (%w and %w{1,4}), and rejects changed punctuation, missing values, rejected templates and overly long fields. It does not dispatch SMS.

Parameter counts must match exactly before rendering; blank or placeholder-valued parameters are rejected. The final SMS guard runs before every Eskiz send request, including legacy doctor reminders, and blocks unresolved `%s`, `%w`, `%d` and OTP braces without logging message content.

`sendApprovedTransactionalSms` supplies one checked send path for all seven events; callers must first enforce event verification, consent and deduplication. Admin-only `eskiz-admin` returns approval and parameter counts for each mapping. Optional `previews: [{ event, values }]` (up to seven) renders against live approved provider text without sending. Current account test on 2026-10-24 returned 403; no real test SMS was sent.

Automatic sending remains disabled: client-writable `notifications` rows are not proof of a paid business event. Dispatch must require server-verified source ownership/state, verified recipient phone, explicit category consent, a service-only deduplicated outbox and an atomic claim. Do not automatically retry unknown provider outcomes. Existing result-only SMS preferences cannot silently opt patients into billing/appointment messages. Existing Telegram delivery remains unchanged.

Mappings: 96928 AI ready; 96929 appointment confirmed; 96931 appointment today; 96930 real paid AI subscription active; 96933 subscription expired; 96934 subscription payment failed; 96935 subscription expiring. Clinic payments and simulated AI payments must not trigger the AI-payment-success text. Sender remains 4546. Provider acceptance does not prove handset delivery.