import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Check, X, Loader2, Trash2, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  id: string; full_name: string; display_name: string; region: string | null;
  phone: string | null; amount: number; message: string | null; is_anonymous: boolean;
  status: string; moderation_note: string | null; created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda", approved: "Tasdiqlangan", rejected: "Rad etilgan",
};

const SponsorsModerationPage = () => {
  const { user, loading, userRole } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  const load = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("sponsor_contributions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast({ title: "Yuklashda xatolik", description: error.message, variant: "destructive" });
    setRows((data as Row[]) || []);
    setFetching(false);
  };

  useEffect(() => { if (userRole === "admin") load(); /* eslint-disable-next-line */ }, [status, userRole]);

  const review = async (id: string, next: "approved" | "rejected") => {
    setBusy(id);
    const { error } = await supabase.from("sponsor_contributions")
      .update({ status: next, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    setBusy(null);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: next === "approved" ? "Tasdiqlandi" : "Rad etildi" });
    setRows(r => r.filter(x => x.id !== id));
  };

  const remove = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.from("sponsor_contributions").delete().eq("id", id);
    setBusy(null);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    setRows(r => r.filter(x => x.id !== id));
    toast({ title: "O'chirildi" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A2540]">
        <div className="animate-spin w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "admin") return <Navigate to={`/dashboard/${userRole || "patient"}`} replace />;

  const filtered = rows.filter(r =>
    !q.trim() || `${r.full_name} ${r.display_name} ${r.phone || ""} ${r.region || ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540] dark:text-foreground">💚 Homiylar moderatsiyasi</h1>
            <p className="text-sm text-muted-foreground">Hissa arizalarini tekshirish va tasdiqlash</p>
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Orqaga</Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <TabsTrigger key={k} value={k}>{v}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Ism, telefon yoki hudud bo'yicha qidirish" className="pl-9" />
          </div>
        </div>

        {fetching ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">Yozuv topilmadi.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground">{r.full_name}</p>
                      {r.is_anonymous && <Badge variant="secondary" className="text-[10px]">Anonim</Badge>}
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{STATUS_LABEL[r.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ro'yxatdagi nom: <span className="font-medium text-foreground">{r.display_name}</span>
                      {r.region ? ` · ${r.region}` : ""}{r.phone ? ` · ${r.phone}` : ""}
                    </p>
                    {r.message && <p className="text-xs text-muted-foreground mt-1 italic">“{r.message}”</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(r.created_at).toLocaleString("uz-UZ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 dark:text-emerald-400">{Number(r.amount).toLocaleString()} so'm</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {r.status !== "approved" && (
                    <Button size="sm" disabled={busy === r.id} onClick={() => review(r.id, "approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Check className="w-4 h-4 mr-1" /> Tasdiqlash
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => review(r.id, "rejected")}>
                      <X className="w-4 h-4 mr-1" /> Rad etish
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => remove(r.id)}
                    className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" /> O'chirish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorsModerationPage;
