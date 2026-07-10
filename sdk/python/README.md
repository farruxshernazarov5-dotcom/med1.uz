# MED1.UZ Python SDK

Official Python client for the [MED1.UZ](https://med1.uz) REST API v1.

## Install

```bash
pip install med1-api
```

## Quick start

```python
from med1_api import Med1Client

med1 = Med1Client(api_key="md1_live_...")

# Directory
clinics = med1.clinics._call("GET", "?city=Tashkent&limit=20")

# AI
reply = med1.ai.doctor(messages=[{"role": "user", "content": "Boshim og'riyapti"}], lang="uz")

# End-user login + JWT auto-attached to subsequent calls
med1.auth.login(phone="+998901234567", password="***")
profile = med1.user._call("GET", "/profile")
```

## Sandbox

```python
sandbox = Med1Client(api_key="md1_sandbox_...")
# every response includes {"sandbox": true}
```

## HMAC signing

```python
med1 = Med1Client(api_key="md1_live_...", hmac_secret="...")
```

Signature: `hex(HMAC-SHA256(secret, f"{ts}.{METHOD}.{path}.{sha256Hex(body)}"))`.

## License

MIT — © 2018–2026 MED-ALL AI SYSTEM MCHJ
