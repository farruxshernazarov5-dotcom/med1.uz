# MED1.UZ SDKs

Official client libraries for the MED1.UZ REST API v1.

| Language        | Path                              | Package                 | Status |
| --------------- | --------------------------------- | ----------------------- | ------ |
| Dart / Flutter  | [`flutter/med1_api`](./flutter/med1_api) | `med1_api` (pub.dev) | Ready — CI publishes on `flutter-sdk-v*` tag |
| JavaScript / TS | [`js`](./js)                      | `@med1uz/api` (npm)    | Ready — Node 18+, Deno, Bun, browser |
| Kotlin / Android| [`kotlin/Med1Client.kt`](./kotlin/Med1Client.kt) | drop-in file          | Ready — OkHttp + kotlinx.serialization |
| Swift / iOS     | [`swift/Med1Client.swift`](./swift/Med1Client.swift) | drop-in file          | Ready — async/await + CryptoKit |
| cURL / bash     | [`curl/README.md`](./curl/README.md)   | copy-paste snippets     | Ready |

All SDKs share the same feature set:
- API-key auth (`x-api-key`) with optional JWT for end-user calls (auto-refresh).
- Optional HMAC-SHA256 request signing (`x-timestamp` + `x-signature`) — enabled per key.
- Sandbox support: keys with `is_sandbox = true` return deterministic mock data.
- 14 AI services, Auth, User, Directory (clinics/doctors/labs/pharmacies), Appointments, EMR, Payments (Click/Payme/Uzum), Notifications, Maps.

Base URL: `https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway`
Interactive docs: <https://med1.uz/api-docs> · OpenAPI: <https://med1.uz/openapi.json>
