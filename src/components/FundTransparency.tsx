import { useEffect, useState } from "react";
import { Loader2, PieChart, CalendarDays, ShieldCheck, Lock, EyeOff, FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type Allocation = {
  id: string; title: string; description: string | null; percent: number;
  planned_amount: number; spent_amount: number; color: string | null; sort_order: number;
};
type Update = {
  id: string; title: string; body: string | null; period_type: string;
  period_start: string | null; period_end: string | null; amount_used: number; progress_percent: number; created_at: string;
};

const fmt = (n: number) => Number(n || 0).toLocaleString("uz-UZ");

const FundTransparency = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, u] = await Promise.all([
        supabase.from("fund_allocations").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("fund_updates").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(12),
      ]);
      setAllocations((a.data as Allocation[]) ?? []);
      setUpdates((u.data as Update[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="py-14 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <PieChart className="w-4 h-4" /> Mablag'lar qayerga sarflanadi
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-black text-foreground mb-2">To'liq shaffoflik</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Har bir so'm oldindan e'lon qilingan yo'nalishlar bo'yicha sarflanadi va davriy hisobotlarda yoritiladi.
          </p>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Allocations */}
            <div className="space-y-4">
              {allocations.map((a) => {
                const pct = a.planned_amount > 0 ? Math.min((a.spent_amount / a.planned_amount) * 100, 100) : 0;
                return (
                  <div key={a.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-bold text-foreground">{a.title}</p>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">{a.percent}%</Badge>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: a.color ?? undefined }} />
                    </div>
                    <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
                      <span>Sarflandi: <strong className="text-foreground">{fmt(a.spent_amount)} so'm</strong></span>
                      <span>Reja: {fmt(a.planned_amount)} so'm</span>
                    </div>
                  </div>
                );
              })}
              {allocations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">Yo'nalishlar hali e'lon qilinmagan.</p>
              )}
            </div>

            {/* Reports feed */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h3 className="font-black text-foreground">Haftalik / oylik hisobotlar</h3>
              </div>
              <div className="relative border-l-2 border-border pl-5 space-y-5">
                {updates.map((u) => (
                  <div key={u.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {u.period_type === "weekly" ? "Haftalik" : u.period_type === "monthly" ? "Oylik" : u.period_type}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("uz-UZ")}
                        </span>
                      </div>
                      <p className="font-bold text-foreground text-sm">{u.title}</p>
                      {u.body && <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{u.body}</p>}
                      <div className="flex items-center justify-between mt-3 text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{fmt(u.amount_used)} so'm sarflandi</span>
                        <span className="text-muted-foreground">{u.progress_percent}% bajarildi</span>
                      </div>
                    </div>
                  </div>
                ))}
                {updates.length === 0 && <p className="text-sm text-muted-foreground">Hisobotlar tez orada e'lon qilinadi.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Privacy guarantees */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-5xl mx-auto mt-10">
          {[
            { icon: Lock, title: "Shaxsiy ma'lumot himoyasi", text: "To'liq ism va telefon raqami hech qachon ommaga chiqarilmaydi." },
            { icon: EyeOff, title: "Anonim rejim", text: "Xohlasangiz, hissangiz 'Anonim' nomi bilan ko'rsatiladi." },
            { icon: FileCheck2, title: "Moderatsiya", text: "Har bir ariza tasdiqlangandan keyingina ommaviy ro'yxatga chiqadi." },
          ].map((g, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <g.icon className="w-6 h-6 text-primary mb-3" />
              <p className="font-bold text-foreground text-sm mb-1">{g.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{g.text}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Ma'lumotlar real vaqtda Med1.uz ma'lumotlar bazasidan olinadi.
        </p>
      </div>
    </section>
  );
};

export default FundTransparency;
