/**
 * MED1.UZ JavaScript / TypeScript SDK
 * Base URL default: https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway
 * Docs: https://med1.uz/api-docs · OpenAPI: https://med1.uz/openapi.json
 */

export const MED1_BASE_URL =
  "https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway";

export interface Med1ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  /** When set, every request is HMAC-signed with x-timestamp + x-signature. */
  hmacSecret?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user?: unknown;
}

type Query = Record<string, string | number | boolean | undefined | null>;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class Med1ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
  ) {
    super(message);
  }
}

export class Med1Client {
  private baseUrl: string;
  private apiKey?: string;
  private accessToken?: string;
  private refreshToken?: string;
  private hmacSecret?: string;
  private fetchImpl: typeof fetch;
  private timeoutMs: number;

  constructor(opts: Med1ClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? MED1_BASE_URL).replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.accessToken = opts.accessToken;
    this.refreshToken = opts.refreshToken;
    this.hmacSecret = opts.hmacSecret;
    this.fetchImpl = opts.fetch ?? fetch;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
  }

  setSession(s: Session) {
    this.accessToken = s.access_token;
    if (s.refresh_token) this.refreshToken = s.refresh_token;
  }

  private buildQuery(q?: Query): string {
    if (!q) return "";
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v != null) p.append(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    query?: Query,
    extraHeaders?: Record<string, string>,
    retry = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}${this.buildQuery(query)}`;
    const bodyText = body == null ? "" : JSON.stringify(body);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      ...extraHeaders,
    };
    if (this.hmacSecret) {
      const ts = Math.floor(Date.now() / 1000).toString();
      const bodyHash = await sha256Hex(bodyText);
      headers["x-timestamp"] = ts;
      headers["x-signature"] = await hmacHex(this.hmacSecret, `${ts}.${method}.${path}.${bodyHash}`);
    }

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method,
        headers,
        body: bodyText || undefined,
        signal: ac.signal,
      });
    } finally {
      clearTimeout(t);
    }

    // Auto-refresh JWT on 401 once.
    if (res.status === 401 && retry && this.refreshToken && !path.startsWith("/v1/auth/")) {
      try {
        const s = await this.auth.refresh(this.refreshToken);
        this.setSession(s);
        return this.request(method, path, body, query, extraHeaders, false);
      } catch { /* fall through */ }
    }

    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = json?.error ?? {};
      throw new Med1ApiError(res.status, err.code ?? "http_error", err.message ?? res.statusText, json?.request_id);
    }
    return (json?.data ?? json) as T;
  }

  // ---- namespaces ----
  auth = {
    login: (b: { email?: string; phone?: string; password: string }) =>
      this.request<Session>("POST", "/v1/auth/login", b),
    register: (b: { email?: string; phone?: string; password: string; metadata?: any }) =>
      this.request<Session>("POST", "/v1/auth/register", b),
    refresh: (refresh_token: string) =>
      this.request<Session>("POST", "/v1/auth/refresh", { refresh_token }),
    logout: () => this.request<{ logged_out: boolean }>("POST", "/v1/auth/logout"),
    forgot: (email: string) => this.request("POST", "/v1/auth/forgot-password", { email }),
    otpSend: (b: { phone?: string; email?: string }) => this.request("POST", "/v1/auth/otp/send", b),
    otpVerify: (b: { token: string; phone?: string; email?: string; type?: "sms" | "email" }) =>
      this.request<Session>("POST", "/v1/auth/otp/verify", b),
  };

  user = {
    profile: (userId?: string) =>
      this.request("GET", "/v1/user/profile", undefined, undefined, userId ? { "x-user-id": userId } : undefined),
    updateProfile: (patch: any, userId?: string) =>
      this.request("PATCH", "/v1/user/profile", patch, undefined, userId ? { "x-user-id": userId } : undefined),
    settings: (patch: any, userId?: string) =>
      this.request("PATCH", "/v1/user/settings", patch, undefined, userId ? { "x-user-id": userId } : undefined),
  };

  clinics = {
    list: (q?: { q?: string; city?: string; limit?: number; offset?: number }) =>
      this.request("GET", "/v1/clinics", undefined, q),
    get: (id: string) => this.request("GET", `/v1/clinics/${id}`),
  };
  doctors = {
    list: (q?: { q?: string; city?: string; specialty?: string; limit?: number }) =>
      this.request("GET", "/v1/doctors", undefined, q),
    get: (id: string) => this.request("GET", `/v1/doctors/${id}`),
  };
  diagnostics = {
    list: (q?: { city?: string; limit?: number }) => this.request("GET", "/v1/diagnostics", undefined, q),
    get: (id: string) => this.request("GET", `/v1/diagnostics/${id}`),
  };
  pharmacies = {
    list: (q?: { city?: string; is_24h?: boolean; has_delivery?: boolean; limit?: number }) =>
      this.request("GET", "/v1/pharmacies", undefined, q),
    get: (id: string) => this.request("GET", `/v1/pharmacies/${id}`),
  };

  appointments = {
    create: (b: any, userId?: string) =>
      this.request("POST", "/v1/appointments", b, undefined, userId ? { "x-user-id": userId } : undefined),
    history: (userId?: string, limit = 50) =>
      this.request("GET", "/v1/appointments/history", undefined, { limit }, userId ? { "x-user-id": userId } : undefined),
    cancel: (id: string) => this.request("DELETE", `/v1/appointments/${id}`),
    checkin: (id: string) => this.request("POST", `/v1/appointments/${id}/checkin`),
  };

  emr = {
    records:       (userId?: string) => this.request("GET", "/v1/emr/records",       undefined, undefined, userId ? { "x-user-id": userId } : undefined),
    analyses:      (userId?: string) => this.request("GET", "/v1/emr/analyses",      undefined, undefined, userId ? { "x-user-id": userId } : undefined),
    prescriptions: (userId?: string) => this.request("GET", "/v1/emr/prescriptions", undefined, undefined, userId ? { "x-user-id": userId } : undefined),
    diagnoses:     (userId?: string) => this.request("GET", "/v1/emr/diagnoses",     undefined, undefined, userId ? { "x-user-id": userId } : undefined),
  };

  payments = {
    click: (b: any) => this.request("POST", "/v1/payments/click", b),
    payme: (b: any) => this.request("POST", "/v1/payments/payme", b),
    uzum:  (b: any) => this.request("POST", "/v1/payments/uzum",  b),
    history: (userId?: string) =>
      this.request("GET", "/v1/payments/history", undefined, undefined, userId ? { "x-user-id": userId } : undefined),
    subscriptions: (userId?: string) =>
      this.request("GET", "/v1/subscriptions", undefined, undefined, userId ? { "x-user-id": userId } : undefined),
    buyMedCoin: (amount: number) => this.request("POST", "/v1/med-coin/purchase", { amount }),
  };

  notifications = {
    telegram: (chat_id: string, text: string) => this.request("POST", "/v1/notifications/telegram", { chat_id, text }),
    email:    (b: { to: string; subject: string; template: string; data?: any }) => this.request("POST", "/v1/notifications/email", b),
    sms:      (b: any) => this.request("POST", "/v1/notifications/sms", b),
    push:     (b: any) => this.request("POST", "/v1/notifications/push", b),
  };

  maps = {
    nearby:   (lat: number, lng: number, radius_km = 10) => this.request("GET", "/v1/maps/nearby", undefined, { lat, lng, radius_km }),
    geofence: () => this.request("GET", "/v1/maps/geofence"),
  };

  ai = (() => {
    const call = (service: string) => (b: any) => this.request("POST", `/v1/ai/${service}`, b);
    return {
      chat:         call("chat"),
      doctor:       call("doctor"),
      symptoms:     call("symptoms"),
      laboratory:   call("laboratory"),
      radiology:    call("radiology"),
      pregnancy:    call("pregnancy"),
      babyCare:     call("baby-care"),
      psychologist: call("psychologist"),
      diet:         call("diet"),
      pharmacy:     call("pharmacy"),
      cosmetology:  call("cosmetology"),
      fitness:      call("fitness"),
      assistant:    call("assistant"),
      monitoring:   call("monitoring"),
      prediction:   call("prediction"),
    };
  })();

  ping() { return this.request<{ pong: boolean }>("GET", "/v1/ping"); }
}

export default Med1Client;
