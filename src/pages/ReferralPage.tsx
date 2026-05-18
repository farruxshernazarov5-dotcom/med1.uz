import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, Users, Wallet, Sparkles, ArrowRight, CheckCircle2, Share2, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TIERS = [
  { name: "Bronze", min: 0, color: "from-amber-600 to-amber-800", perks: ["Standart bonus", "Wallet'ga credits"] },
  { name: "Silver", min: 5, color: "from-slate-400 to-slate-600", perks: ["1.2× multiplier", "Premium badge"] },
  { name: "Gold", min: 15, color: "from-yellow-400 to-yellow-600", perks: ["1.5× multiplier", "Top-10 leaderboard"] },
  { name: "Platinum", min: 40, color: "from-cyan-300 to-blue-500", perks: ["2× multiplier", "Cash-out imkoni"] },
];

const STEPS = [
  { icon: Share2, title: "Kodingizni ulashing", text: "Shaxsiy referral kodingiz va havolangizni do'stlaringizga yuboring." },
  { icon: Users, title: "Ular ro'yxatdan o'tadi", text: "Yangi foydalanuvchi sizning havolangiz orqali Med1.uz'ga qo'shiladi." },
  { icon: Wallet, title: "Siz bonus olasiz", text: "U obuna bo'lganda — credits, oylar va AI bonusi avtomatik hisobingizga tushadi." },
];

export default function ReferralPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Helmet>
        <title>Referral dasturi — Do'stingizni taklif qiling | Med1.uz</title>
        <meta name="description" content="Med1.uz referral dasturi: do'stlaringizni taklif qiling, har bir obuna uchun credits, bonus oylar va AI limit oling. Tier tizimi va leaderboard." />
        <link rel="canonical" href="https://med1.uz/referral" />
      </Helmet>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-12 text-center">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Yangi imkoniyat
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Do'stingizni taklif qiling — bonus oling
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Med1.uz referral dasturida har bir muvaffaqiyatli taklif uchun credits, bonus oylar va AI limit qo'lga kiriting.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/dashboard">
              <Gift className="w-5 h-5" /> Kodimni olish
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/referral-terms">Shartlarni o'qish</Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-10">Qanday ishlaydi?</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <Card key={i} className="relative overflow-hidden">
              <div className="absolute top-3 right-4 text-6xl font-black text-primary/10">{i + 1}</div>
              <CardHeader>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <s.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
          <h2 className="text-3xl font-bold">Tier tizimi</h2>
          <p className="text-muted-foreground mt-2">Ko'proq taklif — yuqori multiplier</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((t) => (
            <Card key={t.name} className="overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${t.color}`} />
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {t.name}
                  <Badge variant="outline">{t.min}+ taklif</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {t.perks.map((p) => (
                    <li key={p} className="flex gap-2 items-start">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Rewards */}
      <section className="container mx-auto px-4 py-12">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-8 md:p-12 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Wallet className="w-10 h-10 mx-auto mb-3 text-primary" />
              <div className="text-3xl font-bold">10 000+</div>
              <div className="text-sm text-muted-foreground mt-1">Credits / muvaffaqiyatli taklif</div>
            </div>
            <div>
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-primary" />
              <div className="text-3xl font-bold">+1 oy</div>
              <div className="text-sm text-muted-foreground mt-1">Bonus obuna har taklif uchun</div>
            </div>
            <div>
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-primary" />
              <div className="text-3xl font-bold">AI Credits</div>
              <div className="text-sm text-muted-foreground mt-1">Premium AI xizmatlari uchun</div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">Tayyormisiz?</h2>
        <p className="text-muted-foreground mb-6">Hozir dashboard'ga kiring va shaxsiy kodingizni oling.</p>
        <Button asChild size="lg" className="gap-2">
          <Link to="/dashboard">
            <Gift className="w-5 h-5" /> Boshlash
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-6">
          To'liq shartlar bilan tanishing —{" "}
          <Link to="/referral-terms" className="underline hover:text-primary">Referral Terms</Link>
        </p>
      </section>
    </div>
  );
}
