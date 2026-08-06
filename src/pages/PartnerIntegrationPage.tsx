import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, Smartphone, Globe, Plug, FileText, KeyRound,
  Webhook, TerminalSquare, CheckCircle2, ArrowRight,
} from "lucide-react";

const BASE_URL = "https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway";

const CHANNELS = [
  {
    icon: Smartphone,
    title: "Mobil ilova (Flutter / Kotlin / Swift / React Native)",
    desc: "End-user JWT bilan ishlaydi. Foydalanuvchi o'z Med Coin balansidan foydalanadi.",
    points: [
      "Login → access_token + refresh_token",
      "AI so'rovlarida `x-user-jwt` header yuboriladi",
      "SDK: med1_api (pub.dev), @med1uz/api (npm), drop-in Kotlin/Swift fayllar",
    ],
  },
  {
    icon: Globe,
    title: "Web ilova / veb-sayt integratsiyasi",
    desc: "Server-side API key + domain whitelist. Kalit hech qachon brauzerga chiqmaydi.",
    points: [
      "Kalit faqat backend'da saqlanadi (proxy endpoint orqali)",
      "`allowed_domains` ro'yxati qat'iy tekshiriladi (CORS + Origin)",
      "Widget/iframe uchun read-only scope tavsiya etiladi",
    ],
  },
  {
    icon: Plug,
    title: "Tashqi API / server-to-server (HAMBI, klinika HIS, sug'urta)",
    desc: "API key + ixtiyoriy HMAC-SHA256 imzo va IP whitelist.",
    points: [
      "`x-api-key` + `x-timestamp` + `x-signature`",
      "Webhook orqali hodisalarni qabul qilish",
      "Sandbox muhitida to'liq test qilish imkoniyati",
    ],
  },
];

const REQUIREMENTS = [
  { t: "Yuridik hujjatlar", d: "Ro'yxatdan o'tgan tashkilot (STIR/INN 9 raqam), rahbar ma'lumoti, guvohnoma nusxasi." },
  { t: "Hamkorlik shartnomasi", d: "MED1.UZ Partner Agreement imzolanadi — /partner-terms sahifasida to'liq matn." },
  { t: "Maxfiylik va tibbiy ma'lumot", d: "Maxfiylik siyosati (/privacy), tibbiy ogohlantirish (/disclaimer) va Cookie siyosati (/cookie-policy) shartlariga rozilik." },
  { t: "Texnik ma'lumot", d: "Production domen(lar), server IP manzillari, webhook URL (faqat HTTPS), aloqa uchun texnik mas'ul." },
  { t: "Xavfsizlik talablari", d: "TLS 1.2+, kalitlarni server tomonda saqlash, kalit rotatsiyasi 90 kun, loglarda PHI saqlamaslik." },
  { t: "Ma'lumot himoyasi", d: "O'zbekiston Respublikasi «Shaxsga doir ma'lumotlar to'g'risida»gi qonuniga muvofiqlik, ma'lumotni faqat kelishilgan maqsadda ishlatish." },
];

const STEPS = [
  "Hamkorlik arizasini topshirish (/partnership) va shartnomani imzolash",
  "Super Admin tomonidan partner profili tasdiqlanadi (status: approved)",
  "Sandbox API kaliti beriladi — mock ma'lumot bilan to'liq test",
  "Domen/IP whitelist va scope'lar sozlanadi",
  "Production kalit chiqariladi, rate-limit tier belgilanadi",
  "Monitoring: /admin/api-center orqali real-time log va analytics",
];

const CODE = `# 1. Kalitni tekshirish
curl -s "${BASE_URL}/v1/ping" \\
  -H "x-api-key: md1_live_xxx"

# 2. Barcha mavjud endpointlar ro'yxati (self-discovery)
curl -s "${BASE_URL}/v1/endpoints" -H "x-api-key: md1_live_xxx"

# 3. AI xizmatlari ro'yxati
curl -s "${BASE_URL}/v1/ai/services" -H "x-api-key: md1_live_xxx"

# 4. AI so'rov (partner hisobidan)
curl -s -X POST "${BASE_URL}/v1/ai/symptoms" \\
  -H "x-api-key: md1_live_xxx" -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Bosh og\\'rig\\'i va isitma"}]}'

# 5. AI so'rov (mobil ilova — foydalanuvchi hisobidan)
curl -s -X POST "${BASE_URL}/v1/ai/doctor" \\
  -H "x-api-key: md1_live_xxx" \\
  -H "x-user-jwt: <supabase_access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Salom"}]}'

# 6. Webhook ro'yxatdan o'tkazish
curl -s -X POST "${BASE_URL}/v1/webhooks" \\
  -H "x-api-key: md1_live_xxx" -H "Content-Type: application/json" \\
  -d '{"url":"https://partner.uz/hooks/med1","events":["appointment.created"]}'`;

export default function PartnerIntegrationPage() {
  useEffect(() => {
    document.title = "Hamkorlar uchun API integratsiya qo'llanmasi · MED1.UZ";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content",
      "MED1.UZ API integratsiya qo'llanmasi: mobil ilova, web sayt va tashqi tizimlarni ulash uchun talablar, hujjatlar, xavfsizlik va bosqichma-bosqich yo'riqnoma.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <Badge variant="secondary" className="mb-3">API v1 · Enterprise</Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Hamkorlar uchun integratsiya qo'llanmasi
        </h1>
        <p className="text-muted-foreground max-w-3xl mb-8">
          MED1.UZ platformasining barcha modullari (AI xizmatlari, klinikalar, shifokorlar,
          navbat va qabul, EMR, to'lovlar, bildirishnomalar, xaritalar) yagona API Gateway
          orqali tashqi web va mobil ilovalarga ochiladi.
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          <Button asChild><Link to="/developers">Developer Portal <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          <Button variant="outline" asChild><Link to="/api-docs">Interaktiv API hujjatlari</Link></Button>
          <Button variant="outline" asChild><Link to="/partnership">Hamkorlik arizasi</Link></Button>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" /> Ulanish kanallari
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {CHANNELS.map((c) => (
              <Card key={c.title} className="p-5">
                <c.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
                <ul className="space-y-1.5">
                  {c.points.map((p) => (
                    <li key={p} className="text-sm flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{p}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Talab qilinadigan hujjatlar va shartlar
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {REQUIREMENTS.map((r) => (
              <Card key={r.t} className="p-5">
                <h3 className="font-semibold mb-1">{r.t}</h3>
                <p className="text-sm text-muted-foreground">{r.d}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Ulanish bosqichlari
          </h2>
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3 items-start">
                <span className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Autentifikatsiya va xavfsizlik
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <h3 className="font-semibold mb-2">API Key</h3>
              <p className="text-sm text-muted-foreground">
                <code className="text-xs">x-api-key: md1_live_...</code> — har bir so'rovda.
                Kalit SHA-256 hash sifatida saqlanadi, scope va rate-limit biriktiriladi.
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold mb-2">HMAC imzo (ixtiyoriy)</h3>
              <p className="text-sm text-muted-foreground">
                <code className="text-xs">x-signature = HMAC-SHA256(secret, timestamp + body)</code>,
                <code className="text-xs"> x-timestamp</code> ±5 daqiqa oynasi.
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold mb-2">End-user JWT</h3>
              <p className="text-sm text-muted-foreground">
                Mobil ilovada <code className="text-xs">x-user-jwt</code> yuborilsa, AI so'rov
                foydalanuvchining o'z hisobidan (Med Coin) yechiladi.
              </p>
            </Card>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
            <TerminalSquare className="h-5 w-5 text-primary" /> Tez boshlash (cURL)
          </h2>
          <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-xs leading-relaxed">
            <code>{CODE}</code>
          </pre>
          <p className="text-sm text-muted-foreground mt-3">
            Base URL: <code className="text-xs">{BASE_URL}</code>
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" /> Webhook hodisalari
          </h2>
          <Card className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4 font-semibold">Hodisa</th>
                    <th className="py-2 font-semibold">Tavsif</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["appointment.created", "Yangi qabul band qilindi"],
                    ["appointment.cancelled", "Qabul bekor qilindi"],
                    ["payment.succeeded", "To'lov muvaffaqiyatli (Click/Payme/Uzum)"],
                    ["lab.result.ready", "Laboratoriya natijasi tayyor"],
                    ["ai.request.completed", "AI tahlil yakunlandi"],
                  ].map(([e, d]) => (
                    <tr key={e} className="border-b last:border-0">
                      <td className="py-2 pr-4"><code className="text-xs">{e}</code></td>
                      <td className="py-2">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Har bir yetkazishda <code>x-med1-signature</code> HMAC-SHA256 imzosi yuboriladi.
              Javob 2xx bo'lmasa 3 marta qayta urinish (exponential backoff).
            </p>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
