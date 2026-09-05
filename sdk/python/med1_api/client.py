"""MED1.UZ Python SDK — synchronous client using requests.

Install:  pip install med1-api
Docs:     https://med1.uz/developers
"""
from __future__ import annotations

import hashlib
import hmac
import json as _json
import time
from typing import Any, Optional

import requests

MED1_BASE_URL = "https://api.med1.uz"


class Med1ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, payload: Any = None):
        super().__init__(f"[{status} {code}] {message}")
        self.status = status
        self.code = code
        self.payload = payload


class _Namespace:
    def __init__(self, client: "Med1Client", prefix: str):
        self._c = client
        self._p = prefix

    def _call(self, method: str, path: str, **kw):
        return self._c.request(method, f"{self._p}{path}", **kw)


class _Auth(_Namespace):
    def login(self, *, email: str = None, phone: str = None, password: str):
        body = {k: v for k, v in {"email": email, "phone": phone, "password": password}.items() if v}
        data = self._call("POST", "/login", json=body)
        if isinstance(data, dict) and data.get("access_token"):
            self._c.set_session(data["access_token"], data.get("refresh_token"))
        return data

    def register(self, **body): return self._call("POST", "/register", json=body)
    def refresh(self, refresh_token: str): return self._call("POST", "/refresh", json={"refresh_token": refresh_token})
    def logout(self): return self._call("POST", "/logout")


class _AI(_Namespace):
    def doctor(self, messages, lang="uz"): return self._call("POST", "/doctor", json={"messages": messages, "lang": lang})
    def symptoms(self, body): return self._call("POST", "/symptoms", json=body)
    def farmatsevt(self, body): return self._call("POST", "/farmatsevt", json=body)
    def dietolog(self, body): return self._call("POST", "/dietolog", json=body)
    def fitness(self, body): return self._call("POST", "/fitness", json=body)
    def psixolog(self, body): return self._call("POST", "/psixolog", json=body)
    def cosmetology(self, body): return self._call("POST", "/cosmetology", json=body)
    def pregnancy(self, body): return self._call("POST", "/pregnancy", json=body)
    def baby_care(self, body): return self._call("POST", "/baby-care", json=body)
    def health_risk(self, body): return self._call("POST", "/health-risk", json=body)
    def health_check(self, body): return self._call("POST", "/health-check", json=body)
    def radiology(self, body): return self._call("POST", "/radiology", json=body)
    def report_analysis(self, body): return self._call("POST", "/report-analysis", json=body)


class Med1Client:
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = MED1_BASE_URL,
        hmac_secret: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.hmac_secret = hmac_secret
        self.timeout = timeout
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.session = requests.Session()

        self.auth = _Auth(self, "/v1/auth")
        self.ai = _AI(self, "/v1/ai")
        self.user = _Namespace(self, "/v1/user")
        self.clinics = _Namespace(self, "/v1/clinics")
        self.doctors = _Namespace(self, "/v1/doctors")
        self.labs = _Namespace(self, "/v1/labs")
        self.pharmacies = _Namespace(self, "/v1/pharmacies")
        self.appointments = _Namespace(self, "/v1/appointments")
        self.emr = _Namespace(self, "/v1/emr")
        self.payments = _Namespace(self, "/v1/payments")
        self.notifications = _Namespace(self, "/v1/notifications")
        self.maps = _Namespace(self, "/v1/maps")

    def set_session(self, access: str, refresh: Optional[str] = None):
        self.access_token = access
        if refresh:
            self.refresh_token = refresh

    def ping(self):
        return self.request("GET", "/v1/ping")

    def request(self, method: str, path: str, *, json: Any = None, params: Any = None, user_id: str = None):
        url = self.base_url + path
        body_text = "" if json is None else _json.dumps(json, separators=(",", ":"), ensure_ascii=False)
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["x-api-key"] = self.api_key
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        if user_id:
            headers["x-user-id"] = user_id
        if self.hmac_secret:
            ts = str(int(time.time()))
            body_hash = hashlib.sha256(body_text.encode()).hexdigest()
            msg = f"{ts}.{method}.{path}.{body_hash}"
            sig = hmac.new(self.hmac_secret.encode(), msg.encode(), hashlib.sha256).hexdigest()
            headers["x-timestamp"] = ts
            headers["x-signature"] = sig

        resp = self.session.request(
            method, url,
            data=body_text if json is not None else None,
            params=params, headers=headers, timeout=self.timeout,
        )
        try:
            data = resp.json()
        except Exception:
            data = {"raw": resp.text}

        if not resp.ok:
            err = (data or {}).get("error") or {}
            raise Med1ApiError(resp.status_code, err.get("code", "http_error"), err.get("message", resp.reason), data)

        return data.get("data", data) if isinstance(data, dict) else data
