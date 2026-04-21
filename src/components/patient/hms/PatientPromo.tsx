import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Copy, Calendar, Sparkles, Percent } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PatientPromo = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCodes = async () => {
      const { data } = await supabase
        .from("cosmetology_promo_codes")
        .select("*, registered_cosmetology(name)")
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().slice(0, 10)}`)
        .order("created_at", { ascending: false })
        .limit(50);
      setCodes(data || []);
      setLoading(false);
    };
    fetchCodes();
  }, []);

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `${code} nusxalandi ✅` });
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">🎁 Aksiyalar va chegirmalar</h2>

      {loading ? <p className="text-sm text-muted-foreground">Yuklanmoqda...</p> :
        codes.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Hozircha aktiv aksiyalar yo'q</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tez orada yangi takliflar paydo bo'ladi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {codes.map(c => {
              const isPercent = c.discount_type === "percent" || c.discount_type === "percentage";
              return (
                <div key={c.id} className="relative overflow-hidden bg-card rounded-2xl border border-border p-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-hero-gradient opacity-10 rounded-full -translate-y-12 translate-x-12" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                        {isPercent ? <Percent className="w-5 h-5 text-primary-foreground" /> : <Tag className="w-5 h-5 text-primary-foreground" />}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {isPercent ? `${c.discount_value}%` : `${Number(c.discount_value).toLocaleString("uz-UZ")} so'm`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">chegirma</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">{(c as any).registered_cosmetology?.name || "Kosmetologiya markazi"}</p>
                    {c.description && <p className="text-xs text-muted-foreground mb-3">{c.description}</p>}
                    <div className="flex items-center gap-2 mb-3">
                      <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono font-bold text-primary tracking-wider">{c.code}</code>
                      <button onClick={() => copy(c.code)} className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      {c.valid_until ? (
                        <span className="text-muted-foreground inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.valid_until).toLocaleDateString("uz-UZ")} gacha</span>
                      ) : <span className="text-muted-foreground">Muddatsiz</span>}
                      {c.max_uses && <span className="text-muted-foreground">{c.used_count || 0}/{c.max_uses}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
};

export default PatientPromo;
