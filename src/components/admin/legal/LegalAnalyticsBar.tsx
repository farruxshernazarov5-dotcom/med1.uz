import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileSignature, ShieldCheck, Clock, AlertTriangle, FileText, Users } from "lucide-react";

interface Stats {
  total: number;
  active: number;
  pending: number;
  expiring: number;
  templates: number;
  signers: number;
}

export default function LegalAnalyticsBar() {
  const [s, setS] = useState<Stats>({ total: 0, active: 0, pending: 0, expiring: 0, templates: 0, signers: 0 });

  useEffect(() => {
    (async () => {
      const in30 = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
      const [tot, act, pend, exp, tpls, sigs] = await Promise.all([
        (supabase as any).from("contracts").select("id", { count: "exact", head: true }),
        (supabase as any).from("contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
        (supabase as any).from("contracts").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
        (supabase as any).from("contracts").select("id", { count: "exact", head: true }).eq("status", "active").lt("effective_until", in30).gt("effective_until", new Date().toISOString()),
        (supabase as any).from("contract_templates").select("id", { count: "exact", head: true }).eq("is_active", true),
        (supabase as any).from("contract_signatures").select("signer_user_id", { count: "exact", head: true }),
      ]);
      setS({
        total: tot.count || 0, active: act.count || 0, pending: pend.count || 0,
        expiring: exp.count || 0, templates: tpls.count || 0, signers: sigs.count || 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Jami shartnomalar", value: s.total, icon: FileSignature, color: "from-blue-500 to-cyan-500" },
    { label: "Faol", value: s.active, icon: ShieldCheck, color: "from-emerald-500 to-green-500" },
    { label: "Tasdiq kutmoqda", value: s.pending, icon: Clock, color: "from-amber-500 to-orange-500" },
    { label: "30 kunda tugaydi", value: s.expiring, icon: AlertTriangle, color: "from-rose-500 to-pink-500" },
    { label: "Andozalar", value: s.templates, icon: FileText, color: "from-violet-500 to-purple-500" },
    { label: "Imzolar", value: s.signers, icon: Users, color: "from-indigo-500 to-blue-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-3 relative overflow-hidden">
          <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full bg-gradient-to-br ${c.color} opacity-20`} />
          <div className="flex items-center gap-2 relative">
            <c.icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <div className="text-2xl font-bold mt-1 relative">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}
