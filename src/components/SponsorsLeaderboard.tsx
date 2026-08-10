import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Trophy, Star, Crown, Medal, Gift, Users, TrendingUp, Sparkles, Zap, Target, ArrowUp, CreditCard, Copy, Check, Stethoscope, Cpu, BookOpen, ShieldCheck, HandHeart, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const DEMO_SPONSORS = [
  { id: 1, name: "BAXODIR ****", region: "Samarqand viloyati", amount: 320000, rank: 1 },
  { id: 2, name: "ABRORBEK ****", region: "Toshkent shahri", amount: 305000, rank: 2 },
  { id: 3, name: "SARDORBEK ****", region: "Andijon viloyati", amount: 200000, rank: 3 },
  { id: 4, name: "ABDULXAMID ****", region: "Toshkent shahri", amount: 172000, rank: 4 },
  { id: 5, name: "Foydalanuvchi", region: "Samarqand viloyati", amount: 172000, rank: 5 },
  { id: 6, name: "FERUZA ****", region: "Toshkent shahri", amount: 165000, rank: 6 },
  { id: 7, name: "Anonim", region: "", amount: 101000, rank: 7 },
  { id: 8, name: "Anonim", region: "", amount: 100000, rank: 8 },
  { id: 9, name: "JASUR ****", region: "Buxoro viloyati", amount: 95000, rank: 9 },
  { id: 10, name: "NILUFAR ****", region: "Farg'ona viloyati", amount: 80000, rank: 10 },
];

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000, 200000];
const GOAL_AMOUNT = 5000000;

const CARD_NUMBER = "5614684809699026";
const CARD_HOLDER = "Shernazarov F";

const FUND_USAGE = [
  { icon: Cpu, title: "AI xizmatlari", desc: "14+ AI modul serverlari va tibbiy modellar uchun", percent: 40, color: "from-violet-500 to-purple-600" },
  { icon: BookOpen, title: "Bilimlar bazasi", desc: "12 000+ tibbiy maqola va atamalarni yangilash", percent: 25, color: "from-blue-500 to-indigo-600" },
  { icon: Stethoscope, title: "Yangi xizmatlar", desc: "Shifokor qidiruv, telemeditsina, laboratoriya", percent: 20, color: "from-emerald-500 to-teal-600" },
  { icon: ShieldCheck, title: "Xavfsizlik", desc: "Ma'lumotlar himoyasi va tizim barqarorligi", percent: 15, color: "from-amber-500 to-orange-600" },
];

const IMPACT_TIERS = [
  { amount: 10000, label: "1 000 foydalanuvchiga bepul AI maslahat", emoji: "💡" },
  { amount: 50000, label: "Bir kunlik server xarajati qoplanadi", emoji: "⚡" },
  { amount: 200000, label: "Yangi tibbiy modul ishga tushadi", emoji: "🚀" },
];

const formatCard = (v: string) => v.replace(/(.{4})/g, "$1 ").trim();

const SponsorsLeaderboard = () => {
  const [showDonate, setShowDonate] = useState(false);
  const [amount, setAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER);
      setCopied(true);
      toast({ title: "Karta raqami nusxalandi", description: formatCard(CARD_NUMBER) });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Nusxalab bo'lmadi", description: formatCard(CARD_NUMBER), variant: "destructive" });
    }
  };

  const totalAmount = DEMO_SPONSORS.reduce((s, sp) => s + sp.amount, 0);
  const progressPercent = Math.min((totalAmount / GOAL_AMOUNT) * 100, 100);
  const displaySponsors = showAll ? DEMO_SPONSORS : DEMO_SPONSORS.slice(0, 6);

  useEffect(() => {
    let start = 0;
    const step = totalAmount / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= totalAmount) { setAnimatedTotal(totalAmount); clearInterval(timer); }
      else setAnimatedTotal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [totalAmount]);

  const handleDonate = () => {
    if (!amount || Number(amount) < 1000) {
      toast({ title: "Minimal summa 1,000 so'm", variant: "destructive" });
      return;
    }
    toast({ title: "💚 Rahmat!", description: `Sizning ${Number(amount).toLocaleString()} so'm hissangiz qabul qilindi!` });
    setShowDonate(false);
    setAmount("");
  };

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/3 via-transparent to-secondary/3" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-primary/5 animate-pulse"
            style={{
              width: `${30 + i * 20}px`, height: `${30 + i * 20}px`,
              top: `${10 + i * 15}%`, left: `${5 + i * 16}%`,
              animationDelay: `${i * 0.5}s`, animationDuration: `${3 + i}s`
            }} />
        ))}
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary px-5 py-2.5 rounded-full text-sm font-semibold mb-5 backdrop-blur-sm border border-primary/20">
            <Heart className="w-4 h-4 animate-pulse" />
            Loyiha homiylarimiz
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight">
            Med1.uz ni birga <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">rivojlantiramiz</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sizning har bir hissangiz millionlab foydalanuvchilar uchun sifatli tibbiy xizmatlar yaratishga yordam beradi.
            Loyiha rivojiga hissa qo'shgan barcha homiylarimizga minnatdorchilik bildiramiz!
          </p>
        </div>

        {/* Donation card — always visible */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative rounded-3xl p-[1px] bg-gradient-to-r from-primary via-secondary to-emerald-500 shadow-2xl">
            <div className="rounded-3xl bg-card p-6 md:p-7">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-bold text-foreground">Hissa qo'shish uchun karta</span>
                <Badge className="ml-auto bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">HUMO / UZCARD</Badge>
              </div>
              <button
                onClick={copyCard}
                className="w-full group text-left rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#1e3a5f] p-5 hover:shadow-lg transition-all">
                <p className="text-white/50 text-[11px] mb-1">Karta raqami</p>
                <p className="font-mono text-xl md:text-2xl font-black text-white tracking-wider select-all">
                  {formatCard(CARD_NUMBER)}
                </p>
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-white/50 text-[10px]">Karta egasi</p>
                    <p className="text-white font-semibold text-sm uppercase tracking-wide">{CARD_HOLDER}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 px-3 py-2 rounded-lg group-hover:bg-white/20 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Nusxalandi" : "Nusxalash"}
                  </span>
                </div>
              </button>
              <p className="text-[11px] text-muted-foreground mt-3 text-center">
                Har qanday summa — hatto 5 000 so'm ham loyihaga katta yordam. Rahmat! 💚
              </p>
            </div>
          </div>
        </div>



        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground flex items-center gap-1">
              <Target className="w-4 h-4 text-primary" />
              {animatedTotal.toLocaleString()} so'm yig'ildi
            </span>
            <span className="text-sm text-muted-foreground">Maqsad: {(GOAL_AMOUNT / 1e6).toFixed(0)}M so'm</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-primary via-secondary to-emerald-500 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercent}%` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">{progressPercent.toFixed(1)}% maqsadga yetildi</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
          {[
            { icon: Users, label: "Homiylar soni", value: DEMO_SPONSORS.length, color: "from-blue-500 to-blue-600" },
            { icon: TrendingUp, label: "Jami hissa", value: `${(totalAmount / 1000).toFixed(0)}K`, color: "from-emerald-500 to-emerald-600" },
            { icon: Zap, label: "O'rtacha hissa", value: `${Math.round(totalAmount / DEMO_SPONSORS.length / 1000)}K`, color: "from-amber-500 to-amber-600" },
            { icon: Star, label: "Eng katta hissa", value: `${(DEMO_SPONSORS[0].amount / 1000).toFixed(0)}K`, color: "from-purple-500 to-purple-600" },
          ].map((s, i) => (
            <div key={i} className="group bg-card border border-border rounded-2xl p-4 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="font-black text-foreground text-xl">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Top 3 podium - professional */}
        <div className="flex justify-center items-end gap-4 md:gap-6 mb-10 max-w-xl mx-auto">
          {podiumOrder.map((idx, posIdx) => {
            const sp = DEMO_SPONSORS[idx];
            const isFirst = idx === 0;
            const sizes = isFirst
              ? { avatar: "w-24 h-24", text: "text-3xl", mt: "-mt-6", badge: "text-sm", podiumH: "h-28" }
              : { avatar: "w-18 h-18", text: "text-xl", mt: "", badge: "text-xs", podiumH: idx === 1 ? "h-20" : "h-16" };
            const gradients = [
              "from-gray-300 to-gray-500 dark:from-gray-500 dark:to-gray-700",
              "from-yellow-400 via-amber-400 to-yellow-500",
              "from-amber-500 to-orange-600"
            ];
            const borderColors = ["border-gray-300", "border-yellow-400 shadow-yellow-500/30 shadow-xl", "border-amber-500"];

            return (
              <div key={sp.id} className={`flex flex-col items-center ${sizes.mt} animate-fade-in`} style={{ animationDelay: `${posIdx * 150}ms` }}>
                <div className="relative mb-2">
                  {isFirst && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                      <Crown className="w-8 h-8 text-yellow-400 drop-shadow-lg animate-bounce" style={{ animationDuration: "2s" }} />
                    </div>
                  )}
                  <div className={`${sizes.avatar} rounded-full bg-gradient-to-br ${gradients[posIdx]} flex items-center justify-center ${sizes.text} font-black text-white border-4 ${borderColors[posIdx]} transition-transform hover:scale-110`}>
                    {sp.name === "Anonim" ? "🎭" : sp.name[0]}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${gradients[posIdx]} flex items-center justify-center text-white text-sm font-black border-2 border-background`}>
                    {sp.rank}
                  </div>
                </div>
                <p className={`font-bold text-foreground ${isFirst ? "text-sm" : "text-xs"} truncate max-w-24 text-center`}>{sp.name}</p>
                <p className="text-[10px] text-muted-foreground">{sp.region}</p>
                <Badge className={`mt-1.5 ${isFirst ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-300 shadow-sm" : "bg-muted text-muted-foreground"} ${sizes.badge} font-bold`}>
                  {(sp.amount / 1000).toFixed(0)}K UZS
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Leaderboard list */}
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-[#0A2540] to-[#1e3a5f] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Homiylar reytingi</span>
                <p className="text-white/40 text-[10px]">Real vaqtda yangilanadi</p>
              </div>
            </div>
            <Badge className="bg-white/10 text-white/80 text-[10px] border-white/10">
              {new Date().toLocaleString("uz-UZ", { month: "long", year: "numeric" })}
            </Badge>
          </div>

          <div className="divide-y divide-border">
            {displaySponsors.slice(3).map((sp, idx) => (
              <div key={sp.id}
                className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 cursor-default
                  ${hoveredId === sp.id ? "bg-primary/5 scale-[1.01]" : "hover:bg-muted/50"}`}
                onMouseEnter={() => setHoveredId(sp.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ animationDelay: `${(idx + 4) * 80}ms` }}>
                <span className="w-8 text-center font-black text-muted-foreground text-lg">{sp.rank}</span>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-sm font-bold text-primary border-2 border-primary/20">
                  {sp.name === "Anonim" ? "🎭" : sp.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{sp.name}</p>
                  {sp.region && <p className="text-[11px] text-muted-foreground">{sp.region}</p>}
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {sp.amount.toLocaleString()}
                  </span>
                  <p className="text-[9px] text-muted-foreground">UZS</p>
                </div>
                {hoveredId === sp.id && <ArrowUp className="w-4 h-4 text-primary animate-bounce shrink-0" />}
              </div>
            ))}
          </div>

          {!showAll && DEMO_SPONSORS.length > 6 && (
            <button onClick={() => setShowAll(true)}
              className="w-full py-4 text-sm text-primary font-bold hover:bg-primary/5 transition-colors border-t border-border flex items-center justify-center gap-2">
              Barcha {DEMO_SPONSORS.length} homiyni ko'rish
              <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">+{DEMO_SPONSORS.length - 6}</span>
            </button>
          )}
        </div>

        {/* Where the money goes */}
        <div className="max-w-4xl mx-auto mt-14">
          <h3 className="text-center font-black text-xl md:text-2xl text-foreground mb-2">
            Yig'ilgan mablag' qayerga sarflanadi?
          </h3>
          <p className="text-center text-sm text-muted-foreground mb-7 max-w-xl mx-auto">
            Har bir so'm shaffof tarzda platformani yaxshilashga yo'naltiriladi — yangi xizmatlar,
            tezroq ishlash va foydalanuvchilar uchun qulayliklar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FUND_USAGE.map((f, i) => (
              <div key={i} className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-foreground text-sm">{f.title}</p>
                      <span className="text-xs font-black text-primary">{f.percent}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${f.color}`} style={{ width: `${f.percent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact tiers — psychological nudge */}
        <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {IMPACT_TIERS.map((t, i) => (
            <button key={i} onClick={() => { setAmount(String(t.amount)); setShowDonate(true); }}
              className="text-left bg-gradient-to-br from-card to-primary/5 border border-primary/15 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <span className="text-2xl">{t.emoji}</span>
              <p className="font-black text-foreground text-lg mt-2">{t.amount.toLocaleString()} so'm</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.label}</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3">
                Shu summani tanlash <ArrowUp className="w-3 h-3 rotate-45" />
              </span>
            </button>
          ))}
        </div>

        {/* Creative thank-you */}
        <div className="max-w-3xl mx-auto mt-12">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-primary/5 p-7 md:p-9 text-center">
            <Quote className="absolute top-4 left-4 w-10 h-10 text-emerald-500/10" />
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              <HandHeart className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-black text-xl text-foreground mb-3">Tashakkurnoma 🌿</h3>
            <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Siz shunchaki pul o'tkazmaysiz — siz kimningdir vaqtida to'g'ri maslahat olishiga,
              kimningdir kasalligini erta aniqlashiga sabab bo'lasiz.
              <br className="hidden md:block" />
              <strong className="text-foreground"> Yaxshilik zanjirining bir halqasi bo'lganingiz uchun rahmat!</strong>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {["Ismingiz homiylar reytingida", "Rasmiy tashakkurnoma", "Premium xizmatlarga erta kirish"].map((b, i) => (
                <Badge key={i} className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium">
                  <Gift className="w-3 h-3 mr-1" /> {b}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* CTA - premium */}
        <div className="text-center mt-12 animate-fade-in">
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-emerald-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-8 border border-primary/20 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/30">
                <Heart className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h3 className="font-black text-xl text-foreground mb-3">
                Jamoamizga qo'shiling!
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                <strong className="text-foreground">2 million+ foydalanuvchiga</strong> ega tibbiy platformaning bir qismi bo'ling.
                Sizning hissangiz — millionlab odamlar uchun sifatli sog'liq xizmati demakdir.
              </p>
              <Button onClick={() => setShowDonate(true)} size="lg"
                className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25 px-10 text-base font-bold">
                <Heart className="w-5 h-5 mr-2" /> Hissa qo'shish
              </Button>
              <p className="text-[10px] text-muted-foreground mt-4">
                Tugmani bosish bilan <Link to="/user-guide#terms" className="text-primary underline">ommaviy offerta</Link> shartlariga rozi bo'lasiz
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      <Dialog open={showDonate} onOpenChange={setShowDonate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              Loyihani qo'llab-quvvatlash
            </DialogTitle>
            <DialogDescription>Hissa qo'shish orqali loyiha rivojiga yordam bering</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎭</span>
                <Label className="text-sm font-medium">Anonim hissa qo'shish</Label>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
            <div>
              <Label className="text-sm font-semibold">Summa (so'm)</Label>
              <Input type="number" placeholder="Masalan: 50000" value={amount}
                onChange={e => setAmount(e.target.value)} className="mt-2 text-lg h-12 font-bold" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all duration-200
                    ${amount === String(a)
                      ? "border-primary bg-primary/10 text-primary shadow-sm scale-105"
                      : "border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                    }`}>
                  {(a / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
            {amount && Number(amount) >= 1000 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  💚 <strong>{Number(amount).toLocaleString()} so'm</strong> hissa qo'shiladi
                </p>
              </div>
            )}
            <Button onClick={handleDonate}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-lg" size="lg">
              <Heart className="w-5 h-5 mr-2" /> Hissa qo'shish
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              <Link to="/user-guide#terms" className="text-primary underline">Ommaviy offerta</Link> shartlariga rozilik
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SponsorsLeaderboard;
