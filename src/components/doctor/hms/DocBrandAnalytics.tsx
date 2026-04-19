import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MousePointerClick, TrendingUp, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { doctorId: string; }

const DocBrandAnalytics = ({ doctorId }: Props) => {
  const [stats, setStats] = useState({ views: 0, clicks: 0, leads: 0, appointments: 0, conversion: 0 });
  const [daily, setDaily] = useState<{ date: string; views: number; clicks: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const sinceStr = since.toISOString().slice(0, 10);

      const [{ data: views }, { count: leadsCount }, { count: apptCount }] = await Promise.all([
        supabase.from("doctor_profile_views").select("view_date,is_click").eq("doctor_id", doctorId).gte("view_date", sinceStr),
        supabase.from("doctor_leads").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId),
      ]);

      const totalViews = views?.length || 0;
      const totalClicks = views?.filter((v: any) => v.is_click).length || 0;
      const conversion = totalViews > 0 ? Math.round(((apptCount || 0) / totalViews) * 100) : 0;
      setStats({ views: totalViews, clicks: totalClicks, leads: leadsCount || 0, appointments: apptCount || 0, conversion });

      const map: Record<string, { views: number; clicks: number }> = {};
      (views || []).forEach((v: any) => {
        if (!map[v.view_date]) map[v.view_date] = { views: 0, clicks: 0 };
        map[v.view_date].views++;
        if (v.is_click) map[v.view_date].clicks++;
      });
      const arr = Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
        .map(([date, v]) => ({ date, ...v }));
      setDaily(arr);
      setLoading(false);
    })();
  }, [doctorId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;

  const maxViews = Math.max(1, ...daily.map((d) => d.views));

  const cards = [
    { label: "Ko'rishlar (30 kun)", value: stats.views, icon: Eye, color: "from-secondary/20 to-secondary/5", iconColor: "text-secondary" },
    { label: "Kliklar", value: stats.clicks, icon: MousePointerClick, color: "from-accent/20 to-accent/5", iconColor: "text-accent" },
    { label: "Xabarlar", value: stats.leads, icon: Users, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500" },
    { label: "Qabullar", value: stats.appointments, icon: Calendar, color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500" },
    { label: "Konversiya", value: `${stats.conversion}%`, icon: TrendingUp, color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-foreground text-lg">Marketing analitika</h3>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c, i) => (
          <div key={i} className={cn("rounded-2xl border border-border p-4 bg-gradient-to-br", c.color)}>
            <c.icon className={cn("w-6 h-6 mb-2", c.iconColor)} />
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h4 className="font-bold text-foreground mb-4 text-sm">Oxirgi 14 kun (ko'rishlar)</h4>
        {daily.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Hali ma'lumot yo'q</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {daily.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gradient-to-t from-secondary to-accent rounded-t" style={{ height: `${(d.views / maxViews) * 100}%`, minHeight: "4px" }} title={`${d.views} ko'rish`} />
                <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocBrandAnalytics;
