import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Heart, Trophy, Crown, Users, TrendingUp, Sparkles, Zap, Target, Star,
  CreditCard, Copy, Check, ShieldCheck, Lock, Brain, HandHeart, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCountUp } from "@/hooks/useCountUp";
import { getRegionNames } from "@/data/uzbekistanRegions";

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000, 200000];
const GOAL_AMOUNT = 5000000;
export const SPONSOR_CARD = "5614 6848 0969 9026";
export const SPONSOR_CARD_OWNER = "Shernazarov F.";

type PublicSponsor = {
  id: string;
  slug: string | null;
  display_name: string;
  region: string | null;
  amount: number;
  message: string | null;
  bio: string | null;
  occupation: string | null;
  website_url: string | null;
  is_anonymous: boolean;
  created_at: string;
};

const emptyForm = {
  full_name: "",
  display_name: "",
  region: "",
  phone: "+998",
  amount: "",
  message: "",
};

const SponsorsLeaderboard = () => {
  const { user } = useAuth();
  const [sponsors, setSponsors] = useState<PublicSponsor[]>([]);
  const [summary, setSummary] = useState({ total_amount: 0, sponsors_count: 0, max_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const [listRes, sumRes] = await Promise.all([
      supabase.rpc("get_public_sponsors", { _limit: 50 }),
      supabase.rpc("get_sponsors_summary"),
    ]);
    if (listRes.data) setSponsors(listRes.data as PublicSponsor[]);
    const s = (sumRes.data as any[])?.[0];
    if (s) setSummary({ total_amount: Number(s.total_amount), sponsors_count: Number(s.sponsors_count), max_amount: Number(s.max_amount) });
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const animatedTotal = useCountUp(summary.total_amount);
  const progressPercent = Math.min((summary.total_amount / GOAL_AMOUNT) * 100, 100);
  const listSponsors = showAll ? sponsors : sponsors.slice(0, 10);
  const podium = sponsors.slice(0, 3);
  const podiumOrder = podium.length === 3 ? [1, 0, 2] : podium.map((_, i) => i);

  const copyCard = async () => {
    await navigator.clipboard.writeText(SPONSOR_CARD.replace(/\s/g, ""));
    setCopied(true);
    toast({ title: "Karta raqami nusxalandi", description: `${SPONSOR_CARD} — ${SPONSOR_CARD_OWNER}` });
    setTimeout(() => setCopied(false), 2500);
  };

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.full_name.trim() || form.full_name.trim().length < 3) {
      toast({ title: "Ism-familiyani to'liq kiriting", variant: "destructive" }); return;
    }
    if (!/^\+998\d{9}$/.test(form.phone.replace(/\s/g, ""))) {
      toast({ title: "Telefon +998XXXXXXXXX formatida bo'lsin", variant: "destructive" }); return;
    }
    if (!amount || amount < 1000) {
      toast({ title: "Minimal summa 1 000 so'm", variant: "destructive" }); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("sponsor_contributions").insert({
      user_id: user?.id ?? null,
      full_name: form.full_name.trim().slice(0, 120),
      display_name: (isAnonymous ? "Anonim" : (form.display_name.trim() || form.full_name.trim().split(" ")[0])).slice(0, 60),
      region: isAnonymous ? null : (form.region || null),
      phone: form.phone.replace(/\s/g, ""),
      amount,
      message: form.message.trim().slice(0, 300) || null,
      is_anonymous: isAnonymous,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Ariza yuborilmadi", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "💚 Rahmat! Arizangiz qabul qilindi",
      description: "Moderatsiyadan so'ng ismingiz homiylar ro'yxatida ko'rinadi. To'lovni karta orqali amalga oshiring.",
    });
    setShowForm(false);
    setForm(emptyForm);
    setIsAnonymous(false);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-secondary/3" />

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
            Sizning har bir hissangiz millionlab foydalanuvchilar uchun bepul tibbiy bilim, AI yordam va
            psixologik qo'llab-quvvatlash xizmatlarini yaratishga sarflanadi.
          </p>
        </div>

        {/* Progress */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground flex items-center gap-1">
              <Target className="w-4 h-4 text-primary" />
              {animatedTotal.toLocaleString()} so'm yig'ildi
            </span>
            <span className="text-sm text-muted-foreground">Maqsad: {(GOAL_AMOUNT / 1e6).toFixed(0)}M so'm</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-secondary to-emerald-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">{progressPercent.toFixed(1)}% maqsadga yetildi</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
          {[
            { icon: Users, label: "Homiylar soni", value: summary.sponsors_count, color: "from-blue-500 to-blue-600" },
            { icon: TrendingUp, label: "Jami hissa", value: `${Math.round(summary.total_amount / 1000)}K`, color: "from-emerald-500 to-emerald-600" },
            { icon: Zap, label: "O'rtacha hissa", value: `${summary.sponsors_count ? Math.round(summary.total_amount / summary.sponsors_count / 1000) : 0}K`, color: "from-amber-500 to-amber-600" },
            { icon: Star, label: "Eng katta hissa", value: `${Math.round(summary.max_amount / 1000)}K`, color: "from-purple-500 to-purple-600" },
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

        {/* Card number block */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="rounded-3xl bg-gradient-to-br from-[#0A2540] to-[#1e3a5f] p-6 md:p-7 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">Hissa qo'shish uchun karta</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-2xl md:text-3xl font-black tracking-widest">{SPONSOR_CARD}</p>
                <p className="text-white/60 text-sm mt-1">{SPONSOR_CARD_OWNER} · Humo/Uzcard</p>
              </div>
              <Button onClick={copyCard} variant="secondary" className="font-bold">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Nusxalandi" : "Nusxalash"}
              </Button>
            </div>
            <p className="text-white/50 text-xs mt-4">
              To'lovdan so'ng quyidagi ariza formasini to'ldiring — moderatsiyadan keyin ismingiz homiylar ro'yxatida paydo bo'ladi.
            </p>
          </div>
        </div>

        {/* Psychological support call */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0 shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-foreground mb-1">Psixologik yordamga chaqiruv</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Har kuni yuzlab odam depressiya, tashvish va stress bilan yolg'iz kurashadi. Sizning hissangiz
                  bepul AI-psixolog konsultatsiyalari, ishonch telefoni materiallari va ruhiy salomatlik bo'yicha
                  o'zbek tilidagi bilim bazasini kengaytirishga yo'naltiriladi.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link to="/ai/psixolog"><Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">AI Psixolog</Badge></Link>
                  <Link to="/transparency"><Badge className="bg-primary/10 text-primary border-primary/20">Mablag' sarfi hisoboti</Badge></Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Podium */}
        {podium.length === 3 && (
          <div className="flex justify-center items-end gap-4 md:gap-6 mb-10 max-w-xl mx-auto">
            {podiumOrder.map((idx, posIdx) => {
              const sp = podium[idx];
              const isFirst = idx === 0;
              const gradients = [
                "from-gray-300 to-gray-500 dark:from-gray-500 dark:to-gray-700",
                "from-yellow-400 via-amber-400 to-yellow-500",
                "from-amber-500 to-orange-600",
              ];
              const borderColors = ["border-gray-300", "border-yellow-400 shadow-yellow-500/30 shadow-xl", "border-amber-500"];
              const body = (
                <div className={`flex flex-col items-center ${isFirst ? "-mt-6" : ""}`}>
                  <div className="relative mb-2">
                    {isFirst && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                        <Crown className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
                      </div>
                    )}
                    <div className={`${isFirst ? "w-24 h-24 text-3xl" : "w-20 h-20 text-xl"} rounded-full bg-gradient-to-br ${gradients[posIdx]} flex items-center justify-center font-black text-white border-4 ${borderColors[posIdx]} transition-transform hover:scale-110`}>
                      {sp.is_anonymous ? "🎭" : sp.display_name[0]}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${gradients[posIdx]} flex items-center justify-center text-white text-sm font-black border-2 border-background`}>
                      {idx + 1}
                    </div>
                  </div>
                  <p className={`font-bold text-foreground ${isFirst ? "text-sm" : "text-xs"} truncate max-w-24 text-center`}>{sp.display_name}</p>
                  <p className="text-[10px] text-muted-foreground">{sp.region ?? ""}</p>
                  <Badge className={`mt-1.5 ${isFirst ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-300" : "bg-muted text-muted-foreground"} text-xs font-bold`}>
                    {Math.round(sp.amount / 1000)}K UZS
                  </Badge>
                </div>
              );
              return (
                <div key={sp.id} className="animate-fade-in" style={{ animationDelay: `${posIdx * 150}ms` }}>
                  {sp.slug && !sp.is_anonymous ? <Link to={`/sponsor/${sp.slug}`}>{body}</Link> : body}
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard */}
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-[#0A2540] to-[#1e3a5f] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Homiylar reytingi</span>
                <p className="text-white/40 text-[10px]">Moderatsiyadan o'tgan hissalar</p>
              </div>
            </div>
            <Badge className="bg-white/10 text-white/80 text-[10px] border-white/10">
              {new Date().toLocaleString("uz-UZ", { month: "long", year: "numeric" })}
            </Badge>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : sponsors.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Hozircha tasdiqlangan homiylar yo'q. Birinchi bo'ling!</div>
          ) : (
            <div className="divide-y divide-border">
              {listSponsors.map((sp, idx) => {
                const row = (
                  <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                    <span className="w-8 text-center font-black text-muted-foreground text-lg">{idx + 1}</span>
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-sm font-bold text-primary border-2 border-primary/20">
                      {sp.is_anonymous ? "🎭" : sp.display_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{sp.display_name}</p>
                      {sp.region && <p className="text-[11px] text-muted-foreground">{sp.region}</p>}
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{Number(sp.amount).toLocaleString()}</span>
                      <p className="text-[9px] text-muted-foreground">UZS</p>
                    </div>
                  </div>
                );
                return sp.slug && !sp.is_anonymous
                  ? <Link key={sp.id} to={`/sponsor/${sp.slug}`}>{row}</Link>
                  : <div key={sp.id}>{row}</div>;
              })}
            </div>
          )}

          {!showAll && sponsors.length > 10 && (
            <button onClick={() => setShowAll(true)}
              className="w-full py-4 text-sm text-primary font-bold hover:bg-primary/5 transition-colors border-t border-border">
              Barcha {sponsors.length} homiyni ko'rish
            </button>
          )}
        </div>

        {/* Privacy guarantee */}
        <div className="max-w-2xl mx-auto mt-6 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-5 py-4">
          <Lock className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Maxfiylik kafolati:</strong> to'liq ism-familiya va telefon raqami hech qachon
            ommaga chiqarilmaydi. Ommaviy ro'yxat faqat xavfsiz maydonlarni qaytaruvchi server funksiyasi orqali shakllanadi.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-emerald-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-8 border border-primary/20 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/30">
                <HandHeart className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-black text-xl text-foreground mb-3">Jamoamizga qo'shiling!</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                <strong className="text-foreground">2 million+ foydalanuvchiga</strong> ega tibbiy platformaning bir qismi bo'ling.
              </p>
              <Button onClick={() => setShowForm(true)} size="lg"
                className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25 px-10 text-base font-bold">
                <Heart className="w-5 h-5 mr-2" /> Hissa qo'shish arizasi
              </Button>
              <p className="text-[10px] text-muted-foreground mt-4">
                Tugmani bosish bilan <Link to="/user-guide#terms" className="text-primary underline">ommaviy offerta</Link> shartlariga rozi bo'lasiz
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Application form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              Homiylik arizasi
            </DialogTitle>
            <DialogDescription>Ariza moderatsiyadan o'tgach ro'yxatda ko'rinadi</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎭</span>
                <Label className="text-sm font-medium">Anonim rejim</Label>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>

            <div>
              <Label className="text-sm font-semibold">Ism-familiya (maxfiy) *</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Masalan: Farrux Shernazarov" className="mt-1.5" />
            </div>

            {!isAnonymous && (
              <>
                <div>
                  <Label className="text-sm font-semibold">Ko'rinadigan nom</Label>
                  <Input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })}
                    placeholder="Masalan: Farrux" className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Hudud</Label>
                  <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}
                    className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Tanlang</option>
                    {getRegionNames().map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <Label className="text-sm font-semibold">Telefon (maxfiy) *</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+998901234567" className="mt-1.5" />
            </div>

            <div>
              <Label className="text-sm font-semibold">Summa (so'm) *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="50000" className="mt-1.5 text-lg h-12 font-bold" />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} type="button" onClick={() => setForm({ ...form, amount: String(a) })}
                    className={`py-2.5 rounded-xl border text-sm font-bold transition-all
                      ${form.amount === String(a) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/40"}`}>
                    {a / 1000}K
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Tilak / xabar</Label>
              <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Loyihaga tilaklaringiz..." rows={3} className="mt-1.5" />
            </div>

            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
              <p className="text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
                To'lov kartasi: <strong className="font-mono">{SPONSOR_CARD}</strong> ({SPONSOR_CARD_OWNER})
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
              To'liq ism va telefon faqat moderatorlar uchun ko'rinadi va hech qachon ommaga chiqarilmaydi.
            </p>

            <Button onClick={submit} disabled={submitting} size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold">
              {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Heart className="w-5 h-5 mr-2" />}
              Arizani yuborish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SponsorsLeaderboard;
