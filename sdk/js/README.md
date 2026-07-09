# MED1.UZ JavaScript / TypeScript SDK

Official client for the MED1.UZ REST API v1. Works in Node.js 18+, browsers,
Deno, and Bun.

## Install

```bash
npm i @med1uz/api
# or
bun add @med1uz/api
```

## Quick start

```ts
import { Med1Client } from "@med1uz/api";

const med1 = new Med1Client({ apiKey: "md1_live_..." });

// Directory
const clinics = await med1.clinics.list({ city: "Tashkent" });

// AI
const reply = await med1.ai.doctor({
  messages: [{ role: "user", content: "Boshim og'riyapti" }],
  lang: "uz",
});

// End-user auth (mobile app pattern)
const session = await med1.auth.login({ phone: "+998901234567", password: "***" });
med1.setSession(session);
const profile = await med1.user.profile();
```

## Sandbox

```ts
const sandbox = new Med1Client({ apiKey: "md1_sandbox_...", baseUrl: MED1_BASE_URL });
```

Sandbox keys return deterministic mock data. Every response includes
`sandbox: true`.

## HMAC-signed requests

If your partner or key requires HMAC, pass `hmacSecret`. The SDK adds
`x-timestamp` and `x-signature` on every request.

```ts
const med1 = new Med1Client({ apiKey: "md1_live_...", hmacSecret: process.env.MED1_HMAC_SECRET });
```

Signature: `hex(HMAC-SHA256(secret, `${ts}.${METHOD}.${path}.${sha256Hex(body)}`))`.

## License

MIT — © 2018–2026 MED-ALL AI SYSTEM MCHJ
