import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, Eye, Bot, Calendar, CreditCard, FileText, Search,
  User, Heart, Star, RefreshCw, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  page_view: { label: "Sahifa", icon: Eye, color: "text-muted-foreground" },
  ai_request: { label: "AI so'rov", icon: Bot, color: "text-primary" },
  appointment: { label: "Qabul", icon: Calendar, color: "text-green-600" },
  payment: { label: "To'lov", icon: CreditCard, color: "text-amber-600" },
  document: { label: "Hujjat", icon: FileText, color: "text-blue-600" },
  search: { label: "Qidiruv", icon: Search, color: "text-cyan-600" },
  profile: { label: "Profil", icon: User, color: "text-purple-600" },
  favorite: { label: "Sevimli", icon: Heart, color: "text-rose-600" },
  review: { label: "Sharh", icon: Star, color: "text-orange-500" },
  auth: { label: "Kirish", icon: Activity, color: "text-slate-500" },
  other: { label: "Boshqa", icon: Activity, color: "text-muted-foreground" },
};

const PAGE_SIZE = 40;

const PatientActivityLog = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const load = async (nextPage = 0, replace = true) => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("user_activity_log")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1);
    if (filter !== "all") q = q.eq("action_type", filter);

    const { data } = await q;
    const list = data || [];
    setHasMore(list.length === PAGE_SIZE);
    setRows((prev) => (replace ? list : [...prev, ...list]));
    setPage(nextPage);
    setLoading(false);
  };

  useEffect(() => {
    setRows([]);
    load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    rows.forEach((r) => {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" });
      (g[key] ||= []).push(r);
    });
    return g;
  }, [rows]);

  const filters = [
    ["all", "Hammasi"],
    ["page_view", "Sahifalar"],
    ["ai_request", "AI so'rovlar"],
    ["appointment", "Qabullar"],
    ["payment", "To'lovlar"],
    ["document", "Hujjatlar"],
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">🕘 Faoliyat tarixi</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Saytdagi barcha amallaringiz shu yerda shaxsiy tarzda saqlanadi
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(0, true)} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-1", loading && "animate-spin")} /> Yangilash
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {filters.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
              filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && rows.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <History className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Faoliyat yo'q</h3>
          <p className="text-muted-foreground text-sm">Saytdan foydalanishni boshlang — amallaringiz shu yerda saqlanadi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{day}</p>
              <div className="space-y-2">
                {items.map((r) => {
                  const meta = TYPE_META[r.action_type] || TYPE_META.other;
                  const Icon = meta.icon;
                  return (
                    <div key={r.id} className="bg-card rounded-xl border border-border p-3 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className={cn("w-4 h-4", meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground text-sm">{r.title}</span>
                          <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                        </div>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                        )}
                        {r.path && <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{r.path}</p>}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(r.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center">
              <Button variant="outline" onClick={() => load(page + 1, false)} disabled={loading}>
                Yana yuklash
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientActivityLog;
