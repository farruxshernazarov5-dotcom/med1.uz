import { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Heart, Target, TrendingUp, ShieldCheck, CalendarDays, ArrowLeft,
  Cpu, BookOpen, Stethoscope, Server, Sparkles, CheckCircle2
} from "lucide-react";
import Header from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import SponsorApplyDialog from "@/components/sponsors/SponsorApplyDialog";
import useCountUp from "@/hooks/useCountUp";

const Footer = lazy(() => import("@/components/Footer"));

const GOAL_AMOUNT = 5000000;

const ICONS: Record<string, typeof Cpu> = {
  cpu: Cpu, book: BookOpen, stethoscope: Stethoscope, shield: ShieldCheck, server: Server,
};

interface Allocation {
  id: string; title: string; description: string | null; percent: number;
  spent_amount: number; planned_amount: number; icon: string | null; color: string | null;
}
interface FundUpdate {
  id: string; title: string; body: string | null; period_type: string;
  period_start: string | null; period_end: string | null;
  amount_used: number; progress_percent: number; created_at: string;
}

const PERIOD_LABEL: Record<string, string> = {
  weekly: "Haftalik", monthly: "Oylik", quarterly: "Choraklik",
};

const TransparencyPage = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [updates, setUpdates] = useState<FundUpdate[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [showApply, setShowApply] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [alloc, upd, summary] = await Promise.all([
      supabase.from("fund_allocations").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("fund_updates").select("*").eq("is_published", true).order("period_end", { ascending: false }).limit(20),
      supabase.rpc("get_sponsors_summary"),
    ]);
    setAllocations((alloc.data as Allocation[]) || []);
    setUpdates((upd.data as FundUpdate[]) || []);
    const s = Array.isArray(summary.data) ? summary.data[0] : null;
    setTotal(Number(s?.total_amount || 0));
    setCount(Number(s?.sponsors_count || 0));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalSpent = allocations.reduce((s, a) => s + Number(a.spent_amount), 0);
  const animatedTotal = useCountUp(total);
  const animatedCount = useCountUp(count, 900);
  const animatedSpent = useCountUp(totalSpent);
  const progressPercent = Math.min((total / GOAL_AMOUNT) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Shaffoflik — mablag' qayerga sarflanadi | Med1.uz"
        description="Med1.uz loyihasiga qo'shilgan hissalar qanday taqsimlanadi: yo'nalishlar, sarflangan summalar, haftalik va oylik hisobotlar."
        path="/transparency"
        ogType="website"
      />
      <Header />

      <main className="container mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifa
        </Link>

        <header className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> To'liq shaffoflik
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-black text-foreground mb-3">
            Yig'ilgan mablag' qayerga sarflanadi?
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Har bir so'm loyihani yaxshilashga yo'naltiriladi. Quyida taqsimot, sarflangan summalar
            va davriy hisobotlar keltirilgan — istalgan vaqtda tekshirishingiz mumkin.
          </p>
        </header>

        {/* Summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
          {[
            { icon: Heart, label: "Yig'ilgan", value: `${animatedTotal.toLocaleString()} so'm`, color: "from-emerald-500 to-teal-600" },
            { icon: TrendingUp, label: "Sarflangan", value: `${animatedSpent.toLocaleString()} so'm`, color: "from-blue-500 to-indigo-600" },
            { icon: Target, label: "Maqsad", value: `${(GOAL_AMOUNT / 1e6).toFixed(0)}M so'm`, color: "from-amber-500 to-orange-600" },
            { icon: Sparkles, label: "Homiylar", value: String(animatedCount), color: "from-violet-500 to-purple-600" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="font-black text-foreground text-sm md:text-base">{s.value}</p>
            </div>
          ))}
        </section>

        {/* Goal progress */}
        <section className="max-w-3xl mx-auto mb-14">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-bold text-foreground">Umumiy maqsad progressi</span>
            <span className="text-muted-foreground">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-secondary to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }} />
          </div>
        </section>

        {/* Allocations */}
        <section className="max-w-4xl mx-auto mb-14">
          <h2 className="font-black text-2xl text-foreground mb-6 text-center">Sarflash yo'nalishlari</h2>
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {allocations.map(a => {
                const Icon = ICONS[a.icon || "cpu"] || Cpu;
                const used = Number(a.planned_amount) > 0
                  ? Math.min((Number(a.spent_amount) / Number(a.planned_amount)) * 100, 100) : 0;
                return (
                  <article key={a.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${a.color || "from-primary to-secondary"} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-foreground text-sm">{a.title}</h3>
                          <span className="text-xs font-black text-primary">{a.percent}%</span>
                        </div>
                        {a.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.description}</p>}
                        <div className="h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${a.color || "from-primary to-secondary"}`} style={{ width: `${used}%` }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {Number(a.spent_amount).toLocaleString()} / {Number(a.planned_amount).toLocaleString()} so'm sarflandi
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Periodic updates */}
        <section className="max-w-3xl mx-auto mb-14">
          <h2 className="font-black text-2xl text-foreground mb-6 text-center">Davriy hisobotlar</h2>
          {updates.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground">Hozircha hisobot chop etilmagan.</p>
          )}
          <div className="space-y-4">
            {updates.map(u => (
              <article key={u.id} className="relative bg-card border border-border rounded-2xl p-5 pl-6">
                <span className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-primary to-emerald-500" />
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {PERIOD_LABEL[u.period_type] || u.period_type}
                  </Badge>
                  {u.period_start && u.period_end && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(u.period_start).toLocaleDateString("uz-UZ")} — {new Date(u.period_end).toLocaleDateString("uz-UZ")}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-foreground">{u.title}</h3>
                {u.body && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{u.body}</p>}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Ishlatilgan: {Number(u.amount_used).toLocaleString()} so'm</span>
                    <span>{u.progress_percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"
                      style={{ width: `${u.progress_percent}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Moderation promise */}
        <section className="max-w-3xl mx-auto mb-14">
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-primary/5 p-7">
            <h2 className="font-black text-xl text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Moderatsiya va maxfiylik kafolati
            </h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                "Har bir ariza moderator tomonidan tekshiriladi — tasdiqlanmagan yozuv ro'yxatda ko'rinmaydi.",
                "To'liq ism-familiya va telefon raqami hech qachon ommaga ochilmaydi.",
                "Xohlasangiz butunlay anonim qolishingiz mumkin.",
                "Noto'g'ri yoki soxta ma'lumot aniqlansa, yozuv ro'yxatdan olib tashlanadi.",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="text-center">
          <Button size="lg" onClick={() => setShowApply(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-10">
            <Heart className="w-5 h-5 mr-2" /> Hissa qo'shish
          </Button>
        </div>
      </main>

      <SponsorApplyDialog open={showApply} onOpenChange={setShowApply} onSubmitted={load} />

      <Suspense fallback={<div className="h-24" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default TransparencyPage;
