## Smart Geo Promotion & Live Notification System

Foydalanuvchi klinika/dorixona/stomatologiya yaqinidan o'tganda real-time geofence trigger ishlab, AI tavsiyali kreativ notification yuboradigan tizim qurish.

### Architecture

```text
[Browser Geolocation watchPosition]
        │
        ▼
[useGeoTracker hook] ── throttle 30s / 50m harakatda
        │
        ▼
[Edge Fn: geo-promo-check]
   • Haversine radius search (clinics + promotions)
   • AI re-ranking (user history + intent)
   • Cooldown check (geo_notifications)
        │
        ▼
[Response: matched promos]
        │
        ├─► Floating promo popup (web)
        ├─► Telegram push (telegram-notify)
        └─► Map markers (Index map widget)
```

### 1. Database (migration)

Yangi jadvallar:
- **`geo_notifications`** — yuborilgan notification log (user_id, promo_id, clinic_id, lat/lng, channel, opened, converted, sent_at). Cooldown uchun (24h per promo per user).
- **`user_location_consent`** — location ruxsati holati va oxirgi koordinata (user_id, granted, last_lat, last_lng, last_seen_at, background_enabled).
- **`geofence_zones`** — admin/klinika tomonidan qo'shimcha zonalar (clinic_id, center_lat, center_lng, radius_m, active_hours, promo_id).
- **`promotions` ga qo'shimcha**: `radius_m` (default 300), `geo_trigger_enabled`, `creative_template` (kreativ matn varianti).

RLS: `geo_notifications` foydalanuvchi o'zinikini ko'radi; klinika o'z `clinic_id` bo'yicha; admin barchasini.

### 2. Edge Functions

- **`geo-promo-check`** (yangi):
  - Input: `{ latitude, longitude, accuracy }`
  - Yaqin (≤2 km) klinikalarni Haversine bilan topadi
  - Faol `promotions` (geo_trigger_enabled, expires_at) ni filterlaydi
  - Cooldown: oxirgi 24 soatda yuborilmagan
  - Smart Match `useSmartMatch` analitikasidan foydalanuvchi `preferred_specialties` bo'yicha re-rank
  - Top 1-3 promo qaytaradi + `geo_notifications` ga insert (channel=web)
  - Agar `telegram_chat_id` bor bo'lsa va priority≥high → `telegram-notify` chaqiradi
- **`geo-creative-gen`** (kichik): Lovable AI orqali kreativ notification matn (emoji+CTA) generatsiya — promo creative_template bo'sh bo'lsa.

### 3. Frontend

- **`src/hooks/useGeoTracker.tsx`** — `navigator.geolocation.watchPosition`, accuracy check, throttle (har 30s yoki 50m+), consent flow, `localStorage` ga last position.
- **`src/components/geo/GeoConsentBanner.tsx`** — birinchi safar location ruxsati so'rash (privacy policy linki bilan).
- **`src/components/geo/GeoPromoPopup.tsx`** — floating animatsiyali popup (kreativ kartochka, "Yo'l ko'rsatish", "Yozilish", "Keyinroq"). framer-motion bilan slide-in.
- **`src/components/geo/NearbyMap.tsx`** — Leaflet (OpenStreetMap, kalitsiz) + promo markerlar. Google Maps API kerak emas → key talab qilmaslik uchun Leaflet ishlatamiz; foydalanuvchi xohlasa keyin Google Maps integratsiyasi qo'shiladi.
- **`src/components/geo/GeoPromoProvider.tsx`** — App.tsx ga qo'shiladi, useGeoTracker ni geo-promo-check edge function bilan bog'laydi va popup chiqaradi.

### 4. Integration points

- **`App.tsx`** — `<GeoPromoProvider />` global mount.
- **`Index.tsx`** — Hero ostiga `<NearbyMap />` widget (yaqin klinikalar + promo markerlar).
- **Patient Dashboard** — "Geo tavsiyalar" bo'limi + history (`geo_notifications`).
- **Clinic Dashboard (`ClinicPromotions.tsx`)** — promoga `radius_m` slider + "Geo trigger yoqish" toggle + analytics (impressions/clicks/conversions per geo).
- **AdminDashboard** — `GeofenceManager` tab: barcha zonalar, radius o'rtacha, top performing promos.

### 5. Notification channels

- **Web push popup** — har 30 daqiqada max 1 popup (UX cooldown).
- **Telegram** — mavjud `telegram-notify` edge function qayta ishlatiladi (kreativ matn + "Yo'l ko'rsatish" inline button bilan `https://www.google.com/maps/dir/?api=1&destination=lat,lng`).
- **Browser Notification API** (foyda berilgan bo'lsa) — background tab uchun.

### 6. Privacy & Consent

- Birinchi tracking oldidan modal: "Joylashuvga ruxsat berasizmi? Sizga yaqin chegirmalarni ko'rsatamiz." + `/privacy` link.
- `user_location_consent.granted=false` → tracking butunlay o'chadi.
- Coordinatlar faqat 100m precision (round) bilan saqlanadi; xom GPS log qilinmaydi.

### 7. Mobile (Capacitor)

- Mavjud `@capacitor/geolocation` va `@capacitor/push-notifications` plaginlari ishlatiladi (already in stack). Background location uchun keyingi bosqichda native config (placeholder TODO comment qo'yiladi).

### Chiqib ketadigan natijalar

- Foydalanuvchi klinika yonidan o'tsa → 2-3 sek ichida kreativ promo popup chiqadi.
- Telegram'ga emoji+CTA xabar.
- Bosh sahifada interaktiv xarita yaqin klinikalar bilan.
- Klinika dashboardida: promo geo-radius sozlash + conversion analitika.
- Admin: barcha geo-trigger statistikasi.

### Texnik tafsilotlar

- Map: **Leaflet + react-leaflet** (kalitsiz, OSM tile) — Google Maps API kalitini talab qilmaydi. Agar foydalanuvchi keyin Google Maps istasa, oson almashtiriladi.
- Distance: Haversine SQL function `nearby_clinics(lat, lng, radius_m)` — performance uchun.
- Throttle: client-side 30s, server-side cooldown 30 daqiqa per user, 24 soat per (user, promo).
- AI: `google/gemini-3-flash-preview` orqali kreativ matn (low cost).
- RLS bilan to'liq ximoyalangan; faqat o'z `geo_notifications`'ini ko'rish.

Tasdiqlasangiz boshlayman.
