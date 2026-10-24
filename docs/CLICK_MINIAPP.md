# Med1.uz — Click MiniApp readiness

Official references (checked 2026-10-23):
- https://one-platform.click.uz/merchant-docs/reference#frontend/description/introduction
- https://one-platform.click.uz/merchant-docs-frontend-json
- https://one-platform.click.uz/merchant-docs-sdk-json
- SDK CDN: https://s3.click.uz/click-one-backend/miniapp-sdk.js (currently 1.0.2)

## Implemented

The entry page is `https://med1.uz/click`: real doctor, clinic, diagnostics, AI, appointment and profile routes plus smart search. It is usable in a normal browser; only the native SDK handshake shows connected Click status. It does not authenticate a Click session as a Med1 user or treat payment-return query values as proof of payment. Register this entry URL with Click. Actual MiniApp payments still require the hosting handoff and dedicated billing credentials below.

The deferred CDN script in `index.html` exposes `window.ClickSDK`. A single native-host handshake runs through `init()`; `ready()` runs after React commits its first screen. The site's existing login is unchanged. Loading the SDK in a normal browser does not activate MiniApp mode: the native Android/iOS transport and successful handshake are required.

Host `context.theme` temporarily overrides the theme through the existing theme provider. It does not overwrite `med1-theme`. `getClickMiniAppState()` exposes platform/theme; `getClickWebSession()` reads the optional per-request session handoff without storing or logging it. No Click session is trusted as a Med1 login.

Recognized Click invoice URLs opened through `openCheckout()` are adapted in MiniApp mode. Amount, service, merchant and transaction fields remain server-owned; Payme and ordinary web/Capacitor checkout behavior remain unchanged. Payment success continues to rely on the existing signature-verified Prepare/Complete callbacks, never a return URL parameter.

## Hosting handoff required

Click sends launch context as **HTTP request headers**: `web-session`, `accept-theme`, `accept-platform`, `Accept-Language`. JavaScript in a static Vite SPA cannot read its initial request headers. The current static hosting does not automatically expose them. Do not fake session detection using URL parameters, localStorage or a second unrelated request.

When launching behind a request-aware hosting layer/reverse proxy, insert these meta tags into the HTML head **per initial request**, before serving it:

```html
<meta name="click-web-session" content="VALIDATED_REQUEST_SESSION_UUID">
<meta name="click-accept-theme" content="light">
<meta name="click-miniapp-service-id" content="DEDICATED_MINIAPP_SERVICE_ID">
```

The placeholders above describe deployment inputs, not credentials to commit. Allow only a UUID for the session, `light`/`dark` for theme, and digits for Service ID; HTML-escape all inserted values. Responses containing sessions must use `Cache-Control: private, no-store` and bypass shared CDN caches. Do not insert Click API keys, merchant secret keys or user profiles into HTML. Session verification/Click auto-login is outside this preparation and requires a guarded server-side integration.

## Before enabling real MiniApp payments

1. Agree MiniApp billing/fiscalization with Click (Didox). Click requires a **new, separate MiniApp Service ID**; existing website Service IDs cannot be reused.
2. Configure the invoice backend with the issued service/merchant credentials through the secure secret store, without breaking existing web billing. Declare the matching public MiniApp Service ID in the hosting meta above. Until it matches the server-issued invoice, MiniApp checkout deliberately refuses to redirect. Never replace a Service ID client-side: that would desynchronize callback signature verification.
3. Confirm the existing Prepare/Complete HTTPS callbacks, server IP/port whitelist and fiscalization; ask Click to activate the issued MiniApp service.
4. Register the Med1 MiniApp URL and test in real Click iOS/Android. No test IDs are supplied by Click's current docs.

## Payment deep link

```text
https://my.click.uz/services/pay/?service_id=...&merchant_id=...&amount=...&transaction_param=...&return_url=ENCODED_RETURN
```

`ENCODED_RETURN` is URL-encoded once by the outer checkout query. Before that encoding, it is:

```text
https://my.click.uz/app/webView?auth=true&hide_cross=false&show_header=true&url=ENCODED_MED1_URL
```

The inner `url` is last and includes an encoded trailing `transaction_id=`; existing Med1 return queries are preserved. `show_header=true` retains the Click top bar. Click may add `mid` itself; no guessed MiniApp ID is committed. The transaction ID received on return is informational only, not proof of payment.

## Verification

Run `bunx vitest run src/lib/clickMiniApp.test.ts`. Browser checks should cover a normal page, successful Android/iOS handshake, ready after render, failed handshake, dark/light host themes and encoded payment return. Browser bridge mocks test the contract, not real Click hosting/session forwarding or actual money movement. Those require the registered MiniApp, dedicated credentials and real-device launch.