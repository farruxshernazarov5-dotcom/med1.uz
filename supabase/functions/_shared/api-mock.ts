// Mock data layer for the MED-ALL API sandbox environment.
// Any API key with is_sandbox=true is routed here so partners can integrate
// without touching production data, real users, real payments or real AI cost.

export const MOCK_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "sandbox@med1.uz",
  full_name: "Sandbox User",
  phone: "+998900000001",
  role: "user",
  created_at: "2026-01-01T00:00:00Z",
};

export const MOCK_TOKENS = {
  access_token: "sandbox.access.token.eyJzYW5kYm94Ijp0cnVlfQ",
  refresh_token: "sandbox.refresh.token.eyJzYW5kYm94Ijp0cnVlfQ",
  expires_in: 3600,
  token_type: "Bearer",
};

export const MOCK_CLINICS = [
  {
    id: "clinic-mock-001",
    name: "MED1 Sandbox Clinic — Toshkent",
    category: "multidisciplinary",
    address: "Amir Temur ko'chasi 108, Toshkent",
    service_city: "Toshkent",
    phone: "+998712000001",
    email: "clinic1@sandbox.med1.uz",
    working_hours: "09:00-21:00",
    specialties: ["Terapiya", "Kardiologiya", "Ginekologiya"],
    latitude: 41.311081,
    longitude: 69.240562,
    logo_url: null,
  },
  {
    id: "clinic-mock-002",
    name: "MED1 Sandbox Clinic — Samarqand",
    category: "multidisciplinary",
    address: "Registon ko'chasi 12, Samarqand",
    service_city: "Samarqand",
    phone: "+998662000002",
    email: "clinic2@sandbox.med1.uz",
    working_hours: "08:00-20:00",
    specialties: ["Pediatriya", "Nevrologiya"],
    latitude: 39.654,
    longitude: 66.9597,
    logo_url: null,
  },
];

export const MOCK_DOCTORS = [
  {
    id: "doctor-mock-001",
    full_name: "Dr. Sandbox Karimov",
    specialty: "Kardiolog",
    experience_years: 12,
    consultation_price: 250000,
    avg_rating: 4.8,
    review_count: 42,
    languages: ["uz", "ru"],
    online_consultation: true,
    city: "Toshkent",
    region: "Toshkent",
    photo_url: null,
  },
  {
    id: "doctor-mock-002",
    full_name: "Dr. Sandbox Yusupova",
    specialty: "Ginekolog",
    experience_years: 8,
    consultation_price: 200000,
    avg_rating: 4.9,
    review_count: 61,
    languages: ["uz", "ru", "en"],
    online_consultation: true,
    city: "Samarqand",
    region: "Samarqand",
    photo_url: null,
  },
];

export const MOCK_PHARMACIES = [
  {
    id: "pharmacy-mock-001",
    name: "MED1 Sandbox Dorixona",
    pharmacy_type: "chain",
    address: "Mustaqillik shoh ko'chasi 5, Toshkent",
    city: "Toshkent",
    region: "Toshkent",
    phone: "+998712000010",
    is_24h: true,
    has_delivery: true,
    avg_rating: 4.7,
    review_count: 88,
    latitude: 41.31,
    longitude: 69.24,
  },
];

export const MOCK_APPOINTMENTS = [
  {
    id: "appt-mock-001",
    patient_id: MOCK_USER.id,
    clinic_id: MOCK_CLINICS[0].id,
    doctor_id: MOCK_DOCTORS[0].id,
    scheduled_at: "2026-07-15T10:00:00Z",
    status: "confirmed",
    reason: "Umumiy tekshiruv",
  },
];

export const MOCK_PAYMENT = {
  invoice_id: "sandbox-inv-001",
  amount: 250000,
  currency: "UZS",
  status: "paid",
  provider: "sandbox",
  paid_at: new Date().toISOString(),
  receipt_url: "https://med1.uz/sandbox/receipt/sandbox-inv-001",
};

export const MOCK_EMR = {
  records: [
    { id: "rec-mock-001", patient_id: MOCK_USER.id, title: "Umumiy qon tahlili", date: "2026-06-01", doctor: "Dr. Sandbox Karimov" },
  ],
  analyses: [
    { id: "lab-mock-001", type: "CBC", result: "Normal", date: "2026-06-01" },
  ],
  prescriptions: [
    { id: "rx-mock-001", drug: "Paracetamol 500mg", dose: "1 tabletka x 3", duration: "5 kun" },
  ],
  diagnoses: [
    { id: "dx-mock-001", icd10: "J06.9", label: "O'tkir yuqori nafas yo'llari infeksiyasi" },
  ],
};

export const MOCK_AI_REPLY = (service: string) => ({
  service,
  reply:
    "🧪 SANDBOX AI JAVOBI — bu haqiqiy tibbiy maslahat emas.\n\n" +
    "Sizning so'rovingiz qabul qilindi. Sandbox rejimida biz oldindan tayyorlangan " +
    "namunaviy javobni qaytaramiz. Ishlab chiqarish (live) API kalitiga o'tganingizda " +
    "haqiqiy Gemini 3 Flash javobini olasiz.\n\n" +
    "⚠️ Har qanday jiddiy alomatlar uchun mutaxassisga murojaat qiling.",
  model: "sandbox/mock-gemini-flash",
  usage: { prompt_tokens: 120, completion_tokens: 180, total_tokens: 300 },
});

// Dispatch — returns { ok: false } when the sandbox has no mock for this path.
export function sandboxDispatch(method: string, path: string): { ok: true; body: unknown } | { ok: false } {
  if (path === "/v1/ping") return { ok: true, body: { pong: true, sandbox: true, timestamp: new Date().toISOString() } };

  // Auth
  if (method === "POST" && (path === "/v1/auth/login" || path === "/v1/auth/register" || path === "/v1/auth/refresh"))
    return { ok: true, body: { user: MOCK_USER, ...MOCK_TOKENS } };
  if (method === "POST" && path.startsWith("/v1/auth/otp/"))
    return { ok: true, body: { sent: true, sandbox: true } };
  if (method === "POST" && (path === "/v1/auth/logout" || path === "/v1/auth/forgot-password"))
    return { ok: true, body: { ok: true } };

  // User
  if (path === "/v1/user/profile") return { ok: true, body: MOCK_USER };

  // Directory
  if (method === "GET" && path === "/v1/clinics") return { ok: true, body: { items: MOCK_CLINICS, count: MOCK_CLINICS.length } };
  if (method === "GET" && path === "/v1/doctors") return { ok: true, body: { items: MOCK_DOCTORS, count: MOCK_DOCTORS.length } };
  if (method === "GET" && path === "/v1/pharmacies") return { ok: true, body: { items: MOCK_PHARMACIES, count: MOCK_PHARMACIES.length } };
  if (method === "GET" && path === "/v1/diagnostics") return { ok: true, body: { items: [], count: 0 } };
  if (method === "GET" && path === "/v1/maternity") return { ok: true, body: { items: [], count: 0 } };
  if (method === "GET" && /^\/v1\/clinics\/[^/]+$/.test(path)) return { ok: true, body: MOCK_CLINICS[0] };
  if (method === "GET" && /^\/v1\/doctors\/[^/]+$/.test(path)) return { ok: true, body: MOCK_DOCTORS[0] };
  if (method === "GET" && /^\/v1\/pharmacies\/[^/]+$/.test(path)) return { ok: true, body: MOCK_PHARMACIES[0] };
  if (method === "GET" && /^\/v1\/diagnostics\/[^/]+$/.test(path)) return { ok: true, body: { id: "diag-mock-001", name: "Sandbox Lab" } };

  // Bookings
  if (method === "POST" && (path === "/v1/bookings" || path === "/v1/appointments"))
    return { ok: true, body: { ...MOCK_APPOINTMENTS[0], created_at: new Date().toISOString() } };
  if (method === "GET" && path === "/v1/appointments/history")
    return { ok: true, body: { items: MOCK_APPOINTMENTS, count: MOCK_APPOINTMENTS.length } };
  if (method === "DELETE" && /^\/v1\/appointments\/[^/]+$/.test(path))
    return { ok: true, body: { cancelled: true } };
  if (method === "POST" && /^\/v1\/appointments\/[^/]+\/checkin$/.test(path))
    return { ok: true, body: { checked_in: true, at: new Date().toISOString() } };

  // EMR
  if (path === "/v1/emr/records") return { ok: true, body: { items: MOCK_EMR.records, count: MOCK_EMR.records.length } };
  if (path === "/v1/emr/analyses") return { ok: true, body: { items: MOCK_EMR.analyses, count: MOCK_EMR.analyses.length } };
  if (path === "/v1/emr/prescriptions") return { ok: true, body: { items: MOCK_EMR.prescriptions, count: MOCK_EMR.prescriptions.length } };
  if (path === "/v1/emr/diagnoses") return { ok: true, body: { items: MOCK_EMR.diagnoses, count: MOCK_EMR.diagnoses.length } };

  // Payments
  if (method === "POST" && path.startsWith("/v1/payments/")) return { ok: true, body: MOCK_PAYMENT };
  if (method === "GET" && path === "/v1/payments/history") return { ok: true, body: { items: [MOCK_PAYMENT], count: 1 } };
  if (method === "GET" && path === "/v1/subscriptions") return { ok: true, body: { items: [], count: 0 } };
  if (method === "POST" && path === "/v1/med-coin/purchase") return { ok: true, body: { credits: 100, price_uzs: 10000, sandbox: true } };

  // Notifications
  if (method === "POST" && path.startsWith("/v1/notifications/")) return { ok: true, body: { queued: true, sandbox: true } };

  // Maps
  if (method === "GET" && path === "/v1/maps/nearby") return { ok: true, body: { items: MOCK_CLINICS, count: MOCK_CLINICS.length } };
  if (method === "GET" && path === "/v1/maps/geofence") return { ok: true, body: { inside: true, zone: "sandbox-zone-1" } };

  // AI (all services)
  if (method === "POST" && path.startsWith("/v1/ai/")) {
    const service = path.replace("/v1/ai/", "") || "chat";
    return { ok: true, body: MOCK_AI_REPLY(service) };
  }

  return { ok: false };
}
