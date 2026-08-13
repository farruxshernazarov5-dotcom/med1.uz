# 9. SLA, versiyalash va qo'llab-quvvatlash

## 9.1. Xizmat darajasi (SLA)

| Ko'rsatkich | Starter | Business | Enterprise |
| --- | --- | --- | --- |
| Uptime (oylik) | 99.0% | 99.5% | 99.9% |
| Katalog javob vaqti (p95) | 800 ms | 500 ms | 350 ms |
| AI matn javobi (p95) | 12 s | 8 s | 6 s |
| Rejalashtirilgan texnik ish | 7 kun oldin | 7 kun oldin | 14 kun oldin |

Texnik ishlar odatda 01:00–05:00 (UTC+5) oralig'ida bajariladi.

## 9.2. Qo'llab-quvvatlash

| Daraja | Ta'rif | Birinchi javob | Yechim maqsadi |
| --- | --- | --- | --- |
| P1 | Production to'liq ishlamayapti | 1 soat | 4 soat |
| P2 | Asosiy funksiya buzilgan | 4 soat | 1 ish kuni |
| P3 | Kichik nosozlik | 1 ish kuni | 5 ish kuni |
| P4 | Savol / maslahat | 2 ish kuni | — |

Aloqa kanallari:

- Texnik: api@med1.uz
- Xavfsizlik: security@med1.uz
- Yuridik / shartnoma: legal@med1.uz
- Partner Dashboard → Support ticket

Murojaatda majburiy: `request_id`, endpoint, UTC vaqt, so'rov/javob namunasi (maxfiy ma'lumotsiz).

## 9.3. Versiyalash siyosati

- Yo'lda versiya: `/v1/...`.
- Orqaga mos o'zgarishlar (yangi maydon, yangi endpoint) ogohlantirishsiz qo'shiladi — mijoz noma'lum maydonlarni e'tiborsiz qoldirishi shart.
- Buzuvchi (breaking) o'zgarishlar faqat yangi major versiyada (`/v2/`).
- Eski versiya deprecated e'lon qilingandan keyin kamida 12 oy ishlaydi.
- Deprecated endpoint javobida: `Deprecation: true` va `Sunset: <sana>` header'lari.

## 9.4. Changelog va xabarnoma

- O'zgarishlar: https://med1.uz/api-docs (Changelog bo'limi) va `apikey.rotated` / `partner.notice` webhook'lari.
- Muhim o'zgarishlar kamida 30 kun oldin e-mail orqali xabar qilinadi.

## 9.5. Status va monitoring

- Xizmat holati: `GET /v1/health`
- Partner Dashboard → Monitoring: so'rovlar soni, xatolik foizi, p95 latency, webhook yetkazish statistikasi.
- Anomaliya aniqlansa (xatolik > 5%) hamkorga avtomatik ogohlantirish yuboriladi.
