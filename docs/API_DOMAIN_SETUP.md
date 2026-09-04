# api.med1.uz — Med1 API domeni

Hamkorlar API kalit orqali integratsiya qilganda barqaror manzil ishlatilishi kerak:
`https://api.med1.uz`.

**Status:** DNS A yozuvi (`api → 89.39.95.5`) qoʻyildi. Endi VDS'da Nginx
konfiguratsiyasi oʻrnatilishi kerak.

## 1. DNS (domen boshqaruv panelida) — BAJARILDI

| Turi | Nomi | Qiymati | TTL |
|------|------|---------|-----|
| A    | api  | 89.39.95.5 | 300 |

`pay.med1.uz` bilan bir xil VDS ishlatiladi.

## 2. VDS'da o'rnatish

### Variant A — bitta buyruq (internet orqali, tavsiya etiladi)

VDS'da (`root` sifatida):

```bash
mkdir -p /root/api-vps && curl -fsSL https://med1.uz/deploy/api-vps/install-api.sh -o /root/api-vps/install-api.sh && curl -fsSL https://med1.uz/deploy/api-vps/nginx-api.med1.uz.conf -o /root/api-vps/nginx-api.med1.uz.conf && sudo bash /root/api-vps/install-api.sh
```

### Variant B — kompyuterdan scp orqali

```bash
scp -r deploy/api-vps root@89.39.95.5:/root/
ssh root@89.39.95.5
sudo bash /root/api-vps/install-api.sh
```

Skript: nginx + certbot o'rnatadi, eski `api.med1*` konfiguratsiyalarini tozalaydi,
yangi konfiguratsiyani qo'yadi, HTTPS sertifikat oladi va self-test qiladi.

## 3. Yo'llar

| URL | Nima qiladi |
|-----|-------------|
| `https://api.med1.uz/health` | Proxy sog'ligi |
| `https://api.med1.uz/v1/ping` | API gateway health (x-api-key talab qiladi, lekin 401 ham OK) |
| `https://api.med1.uz/v1/...` | Barcha hamkor API so'rovlari (api-gateway) |
| `https://api.med1.uz/ai` | AI xizmatlari (ai-external-api) |
| `https://api.med1.uz/` | Hujjatlarga yo'naltiradi (`med1.uz/api-docs`) |

Autentifikatsiya o'zgarmaydi: `x-api-key: <kalit>` sarlavhasi.

```bash
curl -X POST https://api.med1.uz/ai \
  -H "x-api-key: MED1_..." -H "Content-Type: application/json" \
  -d '{"action":"chat","service":"ai-doctor-chat","messages":[{"role":"user","content":"Salom"}],"stream":false}'
```

## 4. Payme integratsiyasi

- Endpoint: `https://pay.med1.uz/payme` (JSON-RPC 2.0, Basic auth `Paycom:KEY`).
- Account parametri: `order_id` (UUID).
- **Order ID amal qilish muddati: 24 soat.** Undan keyin `CheckPerformTransaction` /
  `CreateTransaction` `-31051 (Order is not available for payment)` qaytaradi.
- Payme tranzaksiyasi kutish muddati: 12 soat (`PAYME_TIMEOUT_MS`) — undan keyin
  `PerformTransaction` `-31008` bilan rad etiladi va tranzaksiya bekor qilinadi.

## 5. Tekshirish

DNS propagatsiyasidan so'ng:

```bash
# DNS
dig +short api.med1.uz
# HTTP health (certbotdan oldin 200 bo'lishi kerak)
curl -i http://api.med1.uz/health
# HTTPS health (certbotdan keyin)
curl -i https://api.med1.uz/health
# API gateway erishish (401 xato bo'lsa ham proxy ishlayapti degani)
curl -i https://api.med1.uz/v1/ping
```

Agar `http://api.med1.uz/health` 404 bersa — VDS'da Nginx `api.med1.uz` server
bloki hali oʻrnatilmagan; skriptni ishga tushiring.
