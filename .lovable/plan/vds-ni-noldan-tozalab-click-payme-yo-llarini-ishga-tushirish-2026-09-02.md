# VDS'ni noldan tozalab, Click + Payme yo'llarini ishga tushirish

## Hozirgi holat (jonli tekshiruv, hozirgina)

| Yo'l | Hozir | Kerak |
|---|---|---|
| `/health` | 200, eski marker `med1-click-tasix-proxy` | `"config":"2026-09-02-v3"` |
| `/` | 404 | 302 → med1.uz/payment/success |
| `/payme` | 404 | JSON-RPC javob |
| `/click/prepare`, `/click/complete` | 200 | 200 |
| `/click-prepare`, `/click-complete` | 404 | 200 |

DNS to'g'ri: `pay.med1.uz → 89.39.95.5`. Backend funksiyalari sog'lom — muammo faqat VDS'dagi Nginx.

Skrinshotdagi xatolar sababi: `/etc/nginx/sites-enabled/pay.med1.uzy` va `pay.med1server` nomli buzuq fayllar qolgan, shuning uchun `nginx -t` "unknown directive" beryapti va eski konfiguratsiya ishlayapti. Shu bilan birga VDS'da DNS resolver va hostname ham buzilgan (`Could not resolve host: med1.uz`, `sudo: unable to resolve host vm59104`).

## Nima qilinadi

1. Loyihadagi tiklash skripti (`deploy/click-vps/fix-payme-now.sh`) "hammasi buzilgan VDS" holatiga moslanadi:
   - `/etc/hosts` ga hostname yoziladi (sudo ogohlantirishi yo'qoladi);
   - DNS (1.1.1.1 / 8.8.8.8) tiklanadi;
   - `sites-enabled` va `sites-available` ichidagi barcha eski/buzuq `pay.med1*` fayllar va singan symlinklar o'chiriladi;
   - yagona toza konfiguratsiya yoziladi va `nginx -t` bilan tekshiriladi.
2. Konfiguratsiyaga barcha to'lov yo'llari kiritiladi:
   - Click: `/click/prepare`, `/click/complete` + eski `/click-prepare`, `/click-complete`;
   - Payme: `/payme`, `/payme/`, `/api/payme`;
   - kelajakdagi tizimlar uchun tayyor yo'llar: `/uzum`, `/apelsin`, `/humo` (mos backend funksiyalariga);
   - `/health` → yangi marker, `/` → 302 redirect, qolgan hamma narsa → 404.
3. Yangi qo'llanma `docs/VDS_PAYMENT_SETUP.md` ichida — nusxa-ko'chirib bajariladigan qadam-baqadam buyruqlar (quyidagi ko'rinishda).
4. Skript oxirida self-test: 7+ yo'l uchun status kodlari va Payme javobi ko'rsatiladi.

## VDS'da bajariladigan buyruqlar (qo'llanmaga kiritiladi)

```text
1-qadam  DNS va hostname tiklash
2-qadam  Buzuq nginx fayllarini tozalash
3-qadam  Yangi konfiguratsiyani yozish (skript orqali)
4-qadam  nginx -t va reload
5-qadam  certbot bilan HTTPS
6-qadam  self-test (curl)
```

Skript bitta buyruq bilan ishga tushadi:

```bash
sudo EMAIL=billing@med1.uz bash /tmp/fix-payme-now.sh
```

Skriptni VDS'ga yetkazishning ikki yo'li qo'llanmada yoziladi: loyiha publish qilingandan keyin `curl https://med1.uz/deploy/fix-payme-now.sh`, yoki internetsiz holatda `nano /tmp/fix-payme-now.sh` ichiga qo'lda joylash (to'liq matn qo'llanmada bo'ladi).

## Texnik tafsilotlar

- O'zgaradigan fayllar: `deploy/click-vps/fix-payme-now.sh`, `public/deploy/fix-payme-now.sh`, `deploy/click-vps/nginx-pay.med1.uz.conf`, `deploy/click-vps/install.sh`, `docs/VDS_PAYMENT_SETUP.md`.
- Marker `2026-09-02-v4` ga oshiriladi, `click-admin-diag` funksiyasi shu markerni kutadigan qilinadi (Super Admin panelidagi "eski konfiguratsiya" ogohlantirishlari yo'qoladi).
- Proxy sarlavhalari: `Host`, `Authorization` (Payme Basic Auth uchun majburiy), `X-Real-IP`, `X-Forwarded-For`, SNI (`proxy_ssl_name`), buferlash o'chiq.
- Imzo tekshiruvi, secret kalitlar va to'lov biznes-logikasi backendda qoladi — VDS'ga hech qanday kalit yozilmaydi.

## Tekshiruv

Skript bajarilgach men jonli tekshiraman: `/health` markeri, `/` 302, 4 ta Click yo'li 200, `/payme` `-32504` javobi — so'ng Payme sandboxdagi 6 metodni qayta o'tkazasiz.
