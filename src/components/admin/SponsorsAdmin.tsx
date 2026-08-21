import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X, Trash2, Search, Loader2, Gift, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  id: string; full_name: string; display_name: string; phone: string | null;
  region: string | null; amount: number; message: string | null; bio: string | null;
  is_anonymous: boolean; status: string; slug: string | null; created_at: string;
};

const STATUSES = ["pending", "approved", "rejected"] as const;

const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9\u0400-\u04FF]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

const SponsorsAdmin = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sponsor_contributions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast({ title: "Yuklashda xato", description: error.message, variant: "destructive" });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r =>
      (filter === "all" || r.status === filter) &&
      (!term ||
        r.full_name?.toLowerCase().includes(term) ||
        r.display_name?.toLowerCase().includes(term) ||
        r.phone?.includes(term) ||
        r.region?.toLowerCase().includes(term))
    );
  }, [rows, q, filter]);

  const counts = useMemo(() => ({
    pending: rows.filter(r => r.status === "pending").length,
    approved: rows.filter(r => r.status === "approved").length,
    rejected: rows.filter(r => r.status === "rejected").length,
  }), [rows]);

  const setStatus = async (row: Row, status: string) => {
    setBusy(row.id);
    const patch: Record<string, unknown> = {
      status,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    };
    if (status === "approved" && !row.slug && !row.is_anonymous) {
      patch.slug = `${slugify(row.display_name || row.full_name)}-${row.id.slice(0, 6)}`;
    }
    const { error } = await supabase.from("sponsor_contributions").update(patch).eq("id", row.id);
    setBusy(null);
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: status === "approved" ? "Tasdiqlandi" : "Rad etildi" });
    void load();
  };

  const remove = async (row: Row) => {
    if (!confirm(`"${row.display_name}" arizasi o'chirilsinmi?`)) return;
    setBusy(row.id);
    const { error } = await supabase.from("sponsor_contributions").delete().eq("id", row.id);
    setBusy(null);
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: "O'chirildi" });
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-xl text-foreground">Homiylar moderatsiyasi</h2>
          <p className="text-xs text-muted-foreground">Arizalarni tasdiqlash, rad etish va o'chirish</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {(["pending", "approved", "rejected", "all"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors
              ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            {s === "pending" ? `Kutilmoqda (${counts.pending})`
              : s === "approved" ? `Tasdiqlangan (${counts.approved})`
              : s === "rejected" ? `Rad etilgan (${counts.rejected})` : "Barchasi"}
          </button>
        ))}
        <div className="relative ml-auto min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Ism, telefon, hudud..." className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Ariza topilmadi.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {r.is_anonymous ? "🎭" : (r.display_name?.[0] ?? "?")}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground text-sm">{r.display_name}</p>
                  {r.is_anonymous && <Badge variant="secondary" className="text-[10px]">Anonim</Badge>}
                  <Badge className={`text-[10px] ${
                    r.status === "approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : r.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
                    {r.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.full_name}</span>
                  {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                  {r.region && <span>{r.region}</span>}
                </p>
                {r.message && <p className="text-xs text-muted-foreground mt-1 italic">“{r.message}”</p>}
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-600 dark:text-emerald-400">{Number(r.amount).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">UZS · {new Date(r.created_at).toLocaleDateString("uz-UZ")}</p>
              </div>
              <div className="flex gap-2">
                {r.status !== "approved" && (
                  <Button size="sm" disabled={busy === r.id} onClick={() => setStatus(r, "approved")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => setStatus(r, "rejected")}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="destructive" disabled={busy === r.id} onClick={() => remove(r)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SponsorsAdmin;
