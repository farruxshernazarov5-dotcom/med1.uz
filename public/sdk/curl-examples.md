# MED1.UZ cURL examples

Base URL: `https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway`

Set:
```bash
export MED1_KEY="md1_live_..."          # or md1_sandbox_...
export MED1_BASE="https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway"
```

## Ping
```bash
curl -s "$MED1_BASE/v1/ping" -H "x-api-key: $MED1_KEY"
```

## List clinics
```bash
curl -s "$MED1_BASE/v1/clinics?city=Tashkent&limit=20" -H "x-api-key: $MED1_KEY"
```

## AI doctor chat
```bash
curl -s -X POST "$MED1_BASE/v1/ai/doctor" \
  -H "x-api-key: $MED1_KEY" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Boshim og'\''riyapti"}], "lang":"uz"}'
```

## Book appointment (end user)
```bash
curl -s -X POST "$MED1_BASE/v1/appointments" \
  -H "x-api-key: $MED1_KEY" \
  -H "x-user-id: <UUID>" \
  -H "Content-Type: application/json" \
  -d '{"clinic_id":"...","doctor_id":"...","date":"2026-08-01","time":"10:00","patient_name":"Ali","patient_phone":"+998901234567"}'
```

## HMAC-signed request (bash)
```bash
TS=$(date +%s)
BODY='{"messages":[{"role":"user","content":"salom"}]}'
PATH_="/v1/ai/doctor"
BODY_HASH=$(printf %s "$BODY" | openssl dgst -sha256 -hex | awk '{print $2}')
SIG=$(printf %s "$TS.POST.$PATH_.$BODY_HASH" | openssl dgst -sha256 -hmac "$MED1_HMAC_SECRET" -hex | awk '{print $2}')

curl -s -X POST "$MED1_BASE$PATH_" \
  -H "x-api-key: $MED1_KEY" \
  -H "x-timestamp: $TS" \
  -H "x-signature: $SIG" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

## Sandbox
Use a key with `is_sandbox = true` (issue from Partner Dashboard). All responses include `"sandbox": true`.
