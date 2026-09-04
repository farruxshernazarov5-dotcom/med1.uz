# api.med1.uz — Med1 API domeni

Hamkorlar API kalit orqali integratsiya qilganda barqaror manzil ishlatilishi kerak:
`https://api.med1.uz`. Hozircha bu subdomen DNS'da mavjud emas, shuning uchun brauzer
"bunday sayt topilmadi" deydi.

## 1. DNS (domen boshqaruv panelida)

| Turi | Nomi | Qiymati | TTL |
|------|------|---------|-----|
| A    | api  | 89.39.95.5 | 300 |

`pay.med1.uz` bilan bir xil VDS ishlatiladi.

## 2. VDS'da o'rnatish

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
